import { layout } from "./layout.js";

// Page de téléchargement direct de l'application Android (fichier .apk),
// en attendant la publication officielle sur le Google Play Store. Le même
// fichier signé (même clé) sera utilisé pour la version Play Store, donc pas
// de double travail — cette page sera simplement remplacée par un lien vers
// la fiche Play Store une fois l'application publiée là-bas.
export async function appDownloadPage(): Promise<string> {
  return layout({
    title: "Télécharger l'application Android",
    description:
      "Téléchargez l'application RapidPromo pour Android et installez-la directement, en attendant sa publication sur le Google Play Store.",
    path: "/application",
    body: `
      <div style="max-width:640px; margin:0 auto;">
        <h1>Télécharger l'application RapidPromo</h1>
        <p style="color:#6b7280;">
          En attendant la publication officielle sur le Google Play Store, vous pouvez
          déjà installer l'application RapidPromo sur votre téléphone Android en
          téléchargeant directement le fichier ci-dessous.
        </p>

        <p style="margin:28px 0;">
          <a class="btn" href="/RapidPromo.apk" style="font-size:16px; padding:14px 24px;">
            ⬇ Télécharger RapidPromo.apk (923 Ko)
          </a>
        </p>

        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:18px 20px; margin-bottom:24px;">
          <strong>Comment l'installer ?</strong>
          <ol style="margin:10px 0 0; padding-left:20px; color:#4b5563;">
            <li>Téléchargez le fichier ci-dessus depuis votre téléphone Android (dans Chrome, par exemple).</li>
            <li>Ouvrez le fichier téléchargé. Android peut afficher un message du type
              « Installation bloquée » ou « Source inconnue » : c'est normal, Android
              prévient systématiquement pour toute application qui ne vient pas du Play
              Store.</li>
            <li>Appuyez sur « Paramètres », puis autorisez l'installation depuis cette
              source pour cette seule application, et revenez en arrière pour terminer
              l'installation.</li>
          </ol>
        </div>

        <p style="color:#6b7280; font-size:14px;">
          Ce fichier est signé avec la même clé qui sera utilisée pour la version
          officielle sur le Google Play Store, à venir prochainement. Il est proposé
          uniquement pour Android ; sur iPhone, utilisez RapidPromo directement depuis
          votre navigateur.
        </p>
      </div>
    `,
  });
}

