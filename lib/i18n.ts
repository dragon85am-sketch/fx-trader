export const translations = {
  pl: {
    settings: "Ustawienia",
    settingsDescription: "Zarządzaj kontem i preferencjami aplikacji.",

    profile: "Profil",
    name: "Nazwa",
    save: "Zapisz",
    saveProfile: "Zapisz profil",

    preferences: "Preferencje",
    theme: "Motyw",
    language: "Język",

    security: "Bezpieczeństwo",
    securityDescription:
      "Zarządzaj aktywnymi sesjami na wszystkich urządzeniach.",

    logoutAll: "Wyloguj ze wszystkich urządzeń",
    loggingOut: "Wylogowywanie...",

    changePassword: "Zmiana hasła",
    changePasswordButton: "Zmień hasło",
    currentPassword: "Aktualne hasło",
    newPassword: "Nowe hasło",
    confirmPassword: "Powtórz hasło",

    deleteAccount: "Usuń konto",

    dangerZone: "Strefa zagrożenia",
    dangerZoneDescription: "Usunięcie konta jest nieodwracalne.",

    themeDark: "Ciemny",
    themeLight: "Jasny",
    themeSystem: "System",

    saving: "Zapisywanie...",
    savedSettings: "Zapisano ustawienia",
    savePreferences: "Zapisz preferencje",
    saveError: "Błąd zapisu",
    serverError: "Błąd serwera",

    passwordChanged: "Hasło zostało zmienione",
    passwordChangeError: "Nie udało się zmienić hasła",

    loggedOutAll: "Wylogowano ze wszystkich urządzeń",
    genericError: "Błąd",

    accountDeleted: "Konto zostało usunięte",
    deleteAccountError: "Nie udało się usunąć konta",

    deleteModalDescription:
      "Ta operacja jest nieodwracalna. Konto oraz powiązane dane zostaną usunięte.",
    enterPassword: "Wpisz swoje hasło",
    typeDeleteConfirm: "Wpisz dokładnie: DELETE",
    cancel: "Anuluj",
    deletingAccount: "Usuwanie konta...",
  },

  en: {
    settings: "Settings",
    settingsDescription: "Manage your account and app preferences.",

    profile: "Profile",
    name: "Name",
    save: "Save",
    saveProfile: "Save profile",

    preferences: "Preferences",
    theme: "Theme",
    language: "Language",

    security: "Security",
    securityDescription: "Manage active sessions across all devices.",

    logoutAll: "Log out from all devices",
    loggingOut: "Logging out...",

    changePassword: "Change password",
    changePasswordButton: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",

    deleteAccount: "Delete account",

    dangerZone: "Danger Zone",
    dangerZoneDescription: "Deleting your account is irreversible.",

    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",

    saving: "Saving...",
    savedSettings: "Settings saved",
    savePreferences: "Save preferences",
    saveError: "Save error",
    serverError: "Server error",

    passwordChanged: "Password changed",
    passwordChangeError: "Failed to change password",

    loggedOutAll: "Logged out from all devices",
    genericError: "Error",

    accountDeleted: "Account deleted",
    deleteAccountError: "Failed to delete account",

    deleteModalDescription:
      "This action is irreversible. Your account and related data will be deleted.",
    enterPassword: "Enter your password",
    typeDeleteConfirm: "Type exactly: DELETE",
    cancel: "Cancel",
    deletingAccount: "Deleting account...",
  },
};

export type AppLanguage = keyof typeof translations;
export type TranslationKey = keyof typeof translations.pl;