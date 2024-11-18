const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const app = express();
const port = 3000;

// Datenbank initialisieren
const adapter = new FileSync('db.json');
const db = low(adapter);

// Standardwerte
db.defaults({ countries: [], selected: null }).write();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Länder einreichen
app.post('/submit', (req, res) => {
    const { username, country } = req.body;

    // Prüfen, ob das Land bereits gewählt wurde
    const isAlreadyChosen = db.get('countries').find({ country }).value();
    if (isAlreadyChosen) {
        return res.status(400).send({ message: 'Dieses Land wurde schon gewählt, suche dir ein anderes aus.' });
    }

    // Land speichern
    db.get('countries').push({ username, country }).write();
    res.send({ message: 'Land erfolgreich eingetragen!' });
});

// Ergebnisse anzeigen
app.get('/results', (req, res) => {
    const selected = db.get('selected').value();

    if (!selected) {
        return res.status(404).send({ message: 'Die Ergebnisse sind noch nicht verfügbar.' });
    }

    res.send(selected);
});

// Länder zufällig auswählen (wird manuell oder zeitgesteuert ausgeführt)
app.post('/select-random', (req, res) => {
    const now = new Date();
    const deadline = new Date();
    deadline.setUTCHours(12, 0, 0, 0); // Sonntag 12:00 Uhr UTC

    if (now < deadline) {
        return res.status(400).send({ message: 'Die Auswahl kann erst nach der Deadline erfolgen.' });
    }

    const allCountries = db.get('countries').map('country').value();
    if (allCountries.length < 3) {
        return res.status(400).send({ message: 'Es müssen mindestens 3 Länder vorhanden sein.' });
    }

    const shuffled = allCountries.sort(() => 0.5 - Math.random());
    const selected = {
        appetizer: shuffled[0],
        mainCourse: shuffled[1],
        dessert: shuffled[2]
    };

    db.set('selected', selected).write();
    res.send(selected);
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
