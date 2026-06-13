// TEMP mock upload (no Firebase yet)
export const uploadImage = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(URL.createObjectURL(file)); // fake URL for now
    }, 500);
  });
};

// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "../firebase";

// export const uploadImage = async (file) => {
//   const fileRef = ref(storage, `cases/${Date.now()}-${file.name}`);
//   await uploadBytes(fileRef, file);
//   return await getDownloadURL(fileRef);
// };