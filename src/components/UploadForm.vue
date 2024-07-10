<script setup lang="ts">
import { ref } from "vue";
import { database, functions, storage } from "../main";
import { httpsCallable } from "firebase/functions";
import { ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { ref as databaseRef, set, onValue } from "firebase/database";
import { nanoid } from "nanoid";

const databaseData = ref({
  filepath: "",
  convertedDownloadUrl: "",
});

// Form Inputs
const id = ref(String);
const audioFile = ref(File);
const filetype = ref("mp3");
const artist = ref("Paul");
const album = ref("Summer");
const trackNumber = ref(1);
const trackName = ref("Go Time");
const releaseYear = ref(2024);

// Progress states
const formDisabled = ref(true);
const uploadStarted = ref(false);
const uploadProgress = ref(0);

function setAudioFile(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files) {
    audioFile.value = files[0];
    formDisabled.value = false;
  }
}

function upload() {
  uploadStarted.value = true;

  // Generate id for upload
  id.value = nanoid();

  writeFileToDatabase();
  writeFileToStorage();
}

function writeFileToDatabase() {
  const fileRef = databaseRef(database, `audio/${id.value}`);

  try {
    set(fileRef, {
      filepath: audioFile.value.name,
      filetype: filetype.value,
      artist: artist.value,
      album: album.value,
      trackNumber: trackNumber.value,
      trackName: trackName.value,
      releaseYear: releaseYear.value,
    }).then(() => {
      // Listen to database updates
      onValue(fileRef, (snapshot) => {
        const data = snapshot.val();
        databaseData.value = data;
      });
    });
  } catch (e) {
    console.log(e);
  }
}

function writeFileToStorage() {
  const fileRef = storageRef(
    storage,
    `audio/${id.value}/${audioFile.value.name}`
  );

  const uploadTask = uploadBytesResumable(fileRef, audioFile.value);

  // Register three observers:
  // 1. 'state_changed' observer, called any time the state changes
  // 2. Error observer, called on failure
  // 3. Completion observer, called on successful completion
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      // Observe state change events such as progress, pause, and resume
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      uploadProgress.value = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      );
    },
    (error) => {
      console.log(error);
    },
    () => {
      // Handle successful uploads on complete
      uploadProgress.value = 100;

      const convertAudio = httpsCallable(functions, "convertAudio");
      convertAudio({ id: id.value });
    }
  );
}
</script>

<template>
  <div v-if="uploadStarted">
    <p>File: {{ databaseData.filepath }}</p>
    <p>Upload Progress: {{ uploadProgress }}</p>
    <p v-if="uploadProgress === 100">
      <a
        v-if="databaseData.convertedDownloadUrl"
        :href="databaseData.convertedDownloadUrl"
      >
        Download
      </a>
      <span v-else>Conversion in progress...</span>
    </p>
  </div>

  <form @submit.prevent="upload" v-else>
    <div>
      <label for="file">File</label>
      <input type="file" accept="audio/*" @change="setAudioFile" />
    </div>

    <div>
      <label for="filetype">Convert to:</label>
      <select id="filetype" v-model="filetype">
        <option value="aiff">AIFF</option>
        <option value="flac">FLAC</option>
        <option value="mp3">MP3</option>
      </select>
    </div>

    <h4>Track Information</h4>

    <div>
      <label for="artist">Artist</label>
      <input type="text" id="artist" v-model="artist" />
    </div>
    <div>
      <label for="album">Album</label>
      <input type="text" id="album" v-model="album" />
    </div>
    <div>
      <label for="trackNumber">Track Number</label>
      <input type="number" id="trackNumber" v-model="trackNumber" />
    </div>
    <div>
      <label for="trackName">Track Name</label>
      <input type="text" id="trackName" v-model="trackName" />
    </div>
    <div>
      <label for="releaseYear">Release Year</label>
      <input type="text" id="releaseYear" v-model="releaseYear" />
    </div>

    <input type="submit" :disabled="formDisabled" />
  </form>
</template>

<style scoped></style>
