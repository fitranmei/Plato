# TODO List for Sidebar Darkening on Modal Open

## Completed Tasks
- [x] Create ModalContext.tsx for managing modal state globally
- [x] Modify AppShell.tsx to use ModalProvider and pass isDark to Sidebar
- [x] Update Sidebar.tsx to accept isDark prop and apply dark background when true
- [x] Update kamera/page.tsx to use ModalContext and set isModalOpen based on showModal
- [x] Update manajemen-user/page.tsx to use ModalContext and set isModalOpen based on showModal

## Summary
The sidebar now darkens when the "Tambah Data Kamera" or "Tambah Data User" buttons are clicked, matching the page darkening effect.
