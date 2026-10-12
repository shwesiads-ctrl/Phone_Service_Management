module.exports = function registerCloseConfirmation(window, dialog) {
    let closingConfirmed = false;
    let confirmingClose = false;
    window.on('close', (event) => {
      if (closingConfirmed) return;
      event.preventDefault();
      if (confirmingClose) return;
      confirmingClose = true;
      dialog.showMessageBox(window, {
        type: 'question', title: 'Close FixFlow / App ပိတ်ရန်',
        message: 'Close FixFlow? / FixFlow ကို ပိတ်မလား?',
        detail: 'Save your work before closing. / မပိတ်မီ လုပ်ဆောင်ချက်များကို သိမ်းဆည်းပါ။',
        buttons: ['Cancel / မပိတ်ပါ', 'Close / ပိတ်မည်'], defaultId: 0, cancelId: 0,
      }).then(({ response }) => {
        confirmingClose = false;
        if (response === 1) { closingConfirmed = true; window.close(); }
      }).catch(() => { confirmingClose = false; });
    });
};
