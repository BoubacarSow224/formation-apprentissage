const Certificat = require('../models/Certificat');
const User = require('../models/User');
const Cours = require('../models/Cours');
const path = require('path');

// Génère un PDF à la volée et le stream au client
// Nécessite les paquets pdfkit et qrcode. Si absents, renvoie 501 avec instructions.
exports.downloadCertificat = async (req, res) => {
  const { id } = req.params;
  try {
    const certificat = await Certificat.findById(id).populate('utilisateur', 'nom').populate('formateur', 'nom').populate('cours', 'titre');
    if (!certificat) {
      return res.status(404).json({ success: false, message: 'Certificat introuvable' });
    }

    // Autorisations: propriétaire du certificat, formateur du cours, ou admin
    const user = req.user; // injecté par middleware protect
    if (!user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    const isOwner = certificat.utilisateur && certificat.utilisateur._id.toString() === user.id;
    const isTrainer = certificat.formateur && certificat.formateur._id.toString() === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isTrainer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Essayer de charger pdfkit et qrcode
    let PDFDocument, QRCode;
    try {
      PDFDocument = require('pdfkit');
      QRCode = require('qrcode');
    } catch (e) {
      return res.status(501).json({
        success: false,
        message: "Génération PDF non disponible (dépendances manquantes)",
        detail: "Veuillez installer 'pdfkit' et 'qrcode' côté backend",
        install: "npm install pdfkit qrcode"
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    const filename = `certificat-${certificat.numeroSerie}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // En-tête
    doc.fontSize(22).fillColor('#1976d2').text('Certificat de Réussite', { align: 'center' });
    doc.moveDown();

    // Corps
    doc.fillColor('#000').fontSize(12);
    doc.text(`Numéro de série: ${certificat.numeroSerie}`);
    doc.text(`Apprenant: ${certificat.utilisateur?.nom || certificat.utilisateur}`);
    doc.text(`Cours: ${certificat.cours?.titre || certificat.cours}`);
    doc.text(`Formateur: ${certificat.formateur?.nom || certificat.formateur}`);
    doc.text(`Date d'obtention: ${new Date(certificat.dateObtention).toLocaleDateString()}`);
    doc.text(`Note finale: ${certificat.noteFinale}`);
    doc.text(`Complétion: ${certificat.pourcentageCompletion}%`);
    if (Array.isArray(certificat.competencesValidees) && certificat.competencesValidees.length > 0) {
      doc.moveDown(0.5);
      doc.text('Compétences validées:');
      certificat.competencesValidees.forEach(c => {
        doc.circle(doc.x - 5, doc.y + 6, 2).fill('#1976d2').fillColor('#000');
        doc.text(` ${c.nom} (${c.niveau})`, { continued: false });
      });
      doc.moveDown(0.5);
    }

    // QR code (bas de page)
    const qrData = `CERT:${certificat.numeroSerie}:${certificat.hashVerification}`;
    const qrPng = await QRCode.toBuffer(qrData, { type: 'png', margin: 1, scale: 6 });
    const qrX = doc.page.width / 2 - 60;
    const qrY = doc.page.height - 200;
    doc.image(qrPng, qrX, qrY, { width: 120, height: 120 });
    doc.fontSize(10).fillColor('#555').text('Scanner pour vérifier', qrX, qrY + 125, { width: 120, align: 'center' });

    // Pied de page
    doc.moveDown(2);
    doc.fillColor('#888').fontSize(10).text('Vérification: hash sécurisé', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Erreur lors de la génération du PDF" });
  }
};
