import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "login": "Sign In",
      "register": "Create Account",
      "email": "Email Address",
      "username": "Username",
      "password": "Password",
      "identifier": "Email or Username",
      "submit": "Submit",
      "no_account": "Don't have an account?",
      "have_account": "Already have an account?",
      "verify_title": "Verify Email",
      "verify_desc": "Checking your verification token...",
      "success_verify": "Email verified successfully. Redirecting to login...",
      "error_verify": "Invalid or expired token."
    }
  },
  id: {
    translation: {
      "login": "Masuk",
      "register": "Daftar Akun",
      "email": "Alamat Email",
      "username": "Nama Pengguna",
      "password": "Kata Sandi",
      "identifier": "Email atau Nama Pengguna",
      "submit": "Kirim",
      "no_account": "Belum punya akun?",
      "have_account": "Sudah punya akun?",
      "verify_title": "Verifikasi Email",
      "verify_desc": "Memeriksa token verifikasi Anda...",
      "success_verify": "Email berhasil diverifikasi. Mengalihkan ke halaman masuk...",
      "error_verify": "Token tidak valid atau kedaluwarsa."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;