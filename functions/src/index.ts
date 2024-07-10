import { onCall } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'

import * as admin from 'firebase-admin'
import serviceAccount from './firebase-adminsdk.json'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: 'https://id3-audio-converter-default-rtdb.firebaseio.com',
  storageBucket: 'gs://id3-audio-converter.appspot.com'
})

import { getDatabase } from 'firebase-admin/database'
const db = getDatabase()

import { getStorage, getDownloadURL } from 'firebase-admin/storage'
const storage = getStorage()
const bucket = storage.bucket()

// Initialize FFMPEG
import ffmpegStatic from 'ffmpeg-static'
let ffmpegPath: string;
if (ffmpegStatic !== null) {
  ffmpegPath = ffmpegStatic;
} else {
  throw new Error("ffmpegStatic cannot be null");
}

// For audio conversions
import childProcess from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs'

export const convertAudio = onCall({ cors: true, enforceAppCheck: false }, async (req) => {
  const ref = db.ref(`audio/${req.data.id}`)

  ref.once('value', async (snapshot: admin.database.DataSnapshot) => {
    const data = snapshot.val()

    const downloadFilePath = path.join(os.tmpdir(), data.filepath)
    const conversionFilePath = path.join(os.tmpdir(), `${data.trackNumber} ${data.trackName}.${data.filetype}`)
    const destination = path.join('audio', req.data.id, 'converted', `${data.trackNumber} ${data.trackName}.${data.filetype}`)

    console.log("downloadFilePath", downloadFilePath)
    console.log("conversionFilePath", conversionFilePath)
    console.log("destination", destination)

    await bucket
      .file(`audio/${req.data.id}/${data.filepath}`)
      .download({ destination: downloadFilePath })

    const ffmpegOptions = [
      '-y',
      '-i',
      `${downloadFilePath}`,
      '-i',
      `https://placehold.co/500.png`,
      '-map',
      '0:a',
      '-map',
      '1',
      '-c:1',
      'copy',
      '-af',
      'aformat=s16:44100',
      '-map_metadata',
      '-1',
      '-write_id3v2',
      '1',
      '-id3v2_version',
      '4',
      '-metadata',
      `track=${data.trackNumber}`,
      '-metadata',
      `title=${data.trackName}`,
      '-metadata',
      `artist=${data.artist}`,
      '-metadata',
      `album=${data.album}`,
      '-metadata',
      `date=${data.releaseYear}`,
      '-metadata:s:v',
      'title=Album cover',
      '-metadata:s:v',
      'comment=Cover (front)',
      '-disposition:v',
      'attached_pic',
      `${conversionFilePath}`,
    ]

    // Convert using FFmpeg binary
    await new Promise((resolve, reject) => {
      const child = childProcess.spawn(
        ffmpegPath,
        // note, args must be an array when using spawn
        ffmpegOptions,
      )

      child.on('error', (error) => {
        // catches execution error (bad file)
        logger.info(`Error executing binary: ${ffmpegPath} - ${error}`)
      })

      child.stdout.on('data', (data) => {
        logger.info(`child.stdout: ${data.toString()}`)
      })

      child.stderr.on('data', (data) => {
        logger.info(`child.stderr: ${data.toString()}`)
      })

      child.on('close', async (code) => {
        logger.info(`Process exited with code: ${code}`)
        if (code === 0) {
          resolve("Success")
        } else {
          reject('FFmpeg encountered an error, check the console output')
        }
      })
    })

    await bucket.upload(conversionFilePath, { destination })

    logger.info(`Conversion and upload complete: ${destination}`)

    ref.update({
      convertedDownloadUrl: await getDownloadURL(bucket.file(destination))
    })

    // Delete the temporary files
    fs.unlinkSync(downloadFilePath)
    fs.unlinkSync(conversionFilePath)
  }, (errorObject: admin.FirebaseError) => {
    console.log('The read failed: ' + errorObject)
  })

  return 'Complete'
})
