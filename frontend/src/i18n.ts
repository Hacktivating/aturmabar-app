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
      "error_verify": "Invalid or expired token.",
      "forgot_pwd": "Forgot Password?", "send_reset": "Send Reset Link", "new_pwd": "New Password", "reset_pwd": "Reset Password", "back_login": "Back to Login",
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
      "error_verify": "Token tidak valid atau kedaluwarsa.",
      "forgot_pwd": "Lupa Kata Sandi?", "send_reset": "Kirim Tautan Reset", "new_pwd": "Kata Sandi Baru", "reset_pwd": "Atur Ulang Sandi", "back_login": "Kembali ke Masuk",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // Reads saved language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;