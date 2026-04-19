const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
    return Math.floor(Math.random() * (25000 - 15000 + 1)) + 15000;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (msg) => {
        const m = msg.messages[0];
        if (!m.message) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text;
        const from = m.key.remoteJid;

        // MENU
        if (text === "!menu") {
            await sock.sendMessage(from, {
                text: `📌 ANT BOT FINAL

!share → teks aja
!shareall → teks + gambar/video
!menu`
            });
        }

        // SHARE TEKS
        if (text === "!share") {

            if (!m.message.extendedTextMessage) {
                return sock.sendMessage(from, { text: "❌ Reply pesan dulu 😭" });
            }

            let quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
            let messageText = quoted?.conversation || quoted?.extendedTextMessage?.text;

            if (!messageText) {
                return sock.sendMessage(from, { text: "❌ Tidak ada teks" });
            }

            const groups = await sock.groupFetchAllParticipating();
            const ids = Object.keys(groups);

            let success = 0;
            let failed = 0;

            await sock.sendMessage(from, {
                text: `🚀 Share teks ke ${ids.length} grup...`
            });

            for (let id of ids) {
                try {
                    await sock.sendMessage(id, { text: messageText });
                    success++;
                    console.log("✔", groups[id].subject);
                } catch {
                    failed++;
                    console.log("✖", groups[id].subject);
                }

                let d = randomDelay();
                console.log("Delay:", d/1000);
                await delay(d);
            }

            await sock.sendMessage(from, {
                text: `✅ SELESAI

✔ ${success}
❌ ${failed}`
            });
        }

        // SHARE MEDIA
        if (text === "!shareall") {

            if (!m.message.extendedTextMessage) {
                return sock.sendMessage(from, { text: "❌ Reply pesan dulu 😭" });
            }

            let quotedMsg = await sock.loadMessage(
                m.key.remoteJid,
                m.message.extendedTextMessage.contextInfo.stanzaId
            );

            if (!quotedMsg) {
                return sock.sendMessage(from, { text: "❌ Gagal ambil pesan" });
            }

            const groups = await sock.groupFetchAllParticipating();
            const ids = Object.keys(groups);

            let success = 0;
            let failed = 0;

            await sock.sendMessage(from, {
                text: `🚀 Share media ke ${ids.length} grup...`
            });

            for (let id of ids) {
                try {
                    await sock.copyNForward(id, quotedMsg, true);
                    success++;
                    console.log("✔", groups[id].subject);
                } catch {
                    failed++;
                    console.log("✖", groups[id].subject);
                }

                let d = randomDelay();
                console.log("Delay:", d/1000);
                await delay(d);
            }

            await sock.sendMessage(from, {
                text: `✅ SELESAI

✔ ${success}
❌ ${failed}`
            });
        }
    });
}

startBot();
