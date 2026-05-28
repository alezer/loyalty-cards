import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold text-gray-900 mt-10 mb-3">{children}</h2>
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-800 mt-4 mb-1">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 leading-relaxed mb-3">{children}</p>
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1 text-gray-600 mb-3 ml-2">{children}</ul>
}

function LI({ children }: { children: React.ReactNode }) {
  return <li className="leading-relaxed">{children}</li>
}

function EnContent() {
  return (
    <>
      <P>
        Last updated: 27 May 2026
      </P>

      <SectionTitle>1. Introduction</SectionTitle>
      <P>
        These Terms of Service and Privacy Policy govern your use of Loyalty Cards ("the Service"). By
        creating an account and using the Service, you agree to these terms in full. If you do not agree,
        you must not use the Service.
      </P>

      <SectionTitle>2. Data Controller</SectionTitle>
      <P>
        For the purposes of EU Regulation 2016/679 (General Data Protection Regulation — GDPR), the
        operator of this Service acts as the data controller responsible for your personal data. For any
        data-related enquiries, please contact us at:{' '}
        <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
          privacy@loyaltycards.app
        </a>
      </P>

      <SectionTitle>3. Data We Collect</SectionTitle>
      <P>When you register and use the Service, we collect the following personal data:</P>
      <UL>
        <LI>
          <strong>Account data:</strong> your full name, email address, and encrypted password.
        </LI>
        <LI>
          <strong>Profile data:</strong> your role within the Service (customer, staff, or business owner).
        </LI>
        <LI>
          <strong>Usage data:</strong> stamps collected, rewards earned and redeemed, and timestamps of
          activity.
        </LI>
        <LI>
          <strong>Technical data:</strong> session tokens and authentication metadata processed by our
          infrastructure provider.
        </LI>
      </UL>
      <P>We do not collect any special categories of personal data (e.g. health, race, religion).</P>

      <SectionTitle>4. Legal Basis for Processing</SectionTitle>
      <P>We process your personal data on the following legal bases under GDPR Article 6:</P>
      <UL>
        <LI>
          <strong>Contract performance (Art. 6(1)(b)):</strong> processing necessary to provide the loyalty
          card service you signed up for.
        </LI>
        <LI>
          <strong>Consent (Art. 6(1)(a)):</strong> you have explicitly accepted these Terms when creating
          your account.
        </LI>
        <LI>
          <strong>Legitimate interests (Art. 6(1)(f)):</strong> fraud prevention, security, and service
          integrity.
        </LI>
      </UL>

      <SectionTitle>5. How We Use Your Data</SectionTitle>
      <P>Your personal data is used exclusively to:</P>
      <UL>
        <LI>Provide the loyalty card service (tracking stamps and rewards).</LI>
        <LI>Authenticate your identity and maintain your session.</LI>
        <LI>Send transactional emails (account confirmation, password reset).</LI>
        <LI>Prevent fraud and ensure the security of the Service.</LI>
      </UL>
      <P>
        We do not sell, rent, or share your personal data with third parties for marketing or advertising
        purposes.
      </P>

      <SectionTitle>6. Data Retention</SectionTitle>
      <P>
        We retain your personal data for as long as your account remains active. Stamp history and reward
        records are kept as part of the loyalty card service during the lifetime of your account. Upon
        account deletion, all personal data is permanently and irreversibly erased within 30 days.
      </P>

      <SectionTitle>7. Your Rights Under GDPR</SectionTitle>
      <P>
        As a resident of the European Union or European Economic Area, you have the following rights with
        respect to your personal data:
      </P>
      <UL>
        <LI>
          <strong>Right of access (Art. 15):</strong> request a copy of the data we hold about you.
        </LI>
        <LI>
          <strong>Right to rectification (Art. 16):</strong> request correction of inaccurate or incomplete
          data.
        </LI>
        <LI>
          <strong>Right to erasure (Art. 17):</strong> request deletion of your personal data ("right to
          be forgotten").
        </LI>
        <LI>
          <strong>Right to restriction (Art. 18):</strong> request that we limit how we process your data
          in certain circumstances.
        </LI>
        <LI>
          <strong>Right to data portability (Art. 20):</strong> receive your personal data in a structured,
          machine-readable format.
        </LI>
        <LI>
          <strong>Right to object (Art. 21):</strong> object to processing based on legitimate interests.
        </LI>
        <LI>
          <strong>Right to withdraw consent (Art. 7(3)):</strong> withdraw your consent at any time without
          affecting the lawfulness of processing before withdrawal.
        </LI>
      </UL>
      <P>
        To exercise any of these rights, contact us at{' '}
        <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
          privacy@loyaltycards.app
        </a>
        . We will respond within 30 calendar days.
      </P>

      <SectionTitle>8. How to Delete Your Account and Data</SectionTitle>
      <P>
        You may request full deletion of your account and all associated personal data at any time, free
        of charge. To do so:
      </P>
      <UL>
        <LI>
          Send an email to{' '}
          <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
            privacy@loyaltycards.app
          </a>{' '}
          with the subject <strong>"Account Deletion Request"</strong>.
        </LI>
        <LI>Include the email address associated with your account.</LI>
        <LI>
          Your account and all related personal data (name, email, stamp history, reward records) will be
          permanently deleted within 30 days.
        </LI>
      </UL>
      <P>
        Account deletion is irreversible. Anonymised aggregate statistics (e.g. total stamp counts with
        no personally identifiable information) may be retained for operational purposes.
      </P>

      <SectionTitle>9. Third-Party Data Processors</SectionTitle>
      <P>
        To operate the Service, we rely on the following GDPR-compliant third-party processors, each
        bound by a Data Processing Agreement:
      </P>
      <UL>
        <LI>
          <strong>Supabase</strong> — provides database and authentication infrastructure. Processes account
          data and session tokens. Supabase supports EU data residency and is GDPR-compliant. See their{' '}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline"
          >
            Privacy Policy
          </a>
          .
        </LI>
        <LI>
          <strong>Google Sign-In</strong> — optional OAuth sign-in provider. If you choose to sign in
          with Google, Google processes your authentication credentials. See{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline"
          >
            Google&apos;s Privacy Policy
          </a>
          .
        </LI>
      </UL>
      <P>No other third parties have access to your personal data.</P>

      <SectionTitle>10. Cookies and Session Storage</SectionTitle>
      <P>
        The Service uses session cookies solely to maintain your authenticated session. These cookies are
        strictly necessary for the Service to function and do not require consent under ePrivacy rules.
        No third-party tracking, advertising, or analytics cookies are used.
      </P>

      <SectionTitle>11. Data Security</SectionTitle>
      <P>
        We implement appropriate technical and organisational measures to protect your personal data
        against unauthorised access, accidental loss, destruction, or unauthorised disclosure. Passwords
        are hashed and never stored in plain text. All data is transmitted over encrypted HTTPS
        connections.
      </P>

      <SectionTitle>12. International Data Transfers</SectionTitle>
      <P>
        Your data may be stored on servers located within the European Union or in countries that provide
        an adequate level of data protection as recognised by the European Commission. Where data is
        transferred outside the EEA, appropriate safeguards (such as Standard Contractual Clauses) are
        in place.
      </P>

      <SectionTitle>13. Changes to These Terms</SectionTitle>
      <P>
        We may update these Terms from time to time to reflect changes in the Service or applicable law.
        When material changes are made, we will notify you by email or by displaying a notice within the
        Service before the changes take effect. Continued use of the Service after the effective date
        constitutes acceptance of the revised Terms.
      </P>

      <SectionTitle>14. Right to Lodge a Complaint</SectionTitle>
      <P>
        If you believe we have not handled your personal data in accordance with GDPR, you have the right
        to lodge a complaint with the supervisory authority in your country of residence. A complete list
        of EU data protection authorities is available at{' '}
        <a
          href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline"
        >
          edpb.europa.eu
        </a>
        .
      </P>

      <SectionTitle>15. Contact</SectionTitle>
      <P>
        For any questions, requests, or concerns regarding these Terms or the processing of your personal
        data, please contact us at:{' '}
        <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
          privacy@loyaltycards.app
        </a>
      </P>
    </>
  )
}

function EsContent() {
  return (
    <>
      <P>
        Última actualización: 27 de mayo de 2026
      </P>

      <SectionTitle>1. Introducción</SectionTitle>
      <P>
        Estos Términos de Servicio y Política de Privacidad regulan el uso de Loyalty Cards ("el
        Servicio"). Al crear una cuenta y utilizar el Servicio, aceptas estos términos en su totalidad.
        Si no estás de acuerdo, no debes utilizar el Servicio.
      </P>

      <SectionTitle>2. Responsable del tratamiento</SectionTitle>
      <P>
        A los efectos del Reglamento (UE) 2016/679 (Reglamento General de Protección de Datos — RGPD),
        el operador de este Servicio actúa como responsable del tratamiento de tus datos personales.
        Para cualquier consulta relacionada con tus datos, puedes contactarnos en:{' '}
        <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
          privacy@loyaltycards.app
        </a>
      </P>

      <SectionTitle>3. Datos que recopilamos</SectionTitle>
      <P>Al registrarte y utilizar el Servicio, recopilamos los siguientes datos personales:</P>
      <UL>
        <LI>
          <strong>Datos de cuenta:</strong> nombre completo, dirección de correo electrónico y contraseña
          cifrada.
        </LI>
        <LI>
          <strong>Datos de perfil:</strong> tu rol dentro del Servicio (cliente, personal o propietario
          de comercio).
        </LI>
        <LI>
          <strong>Datos de uso:</strong> sellos acumulados, premios obtenidos y canjeadas, y marcas
          de tiempo de la actividad.
        </LI>
        <LI>
          <strong>Datos técnicos:</strong> tokens de sesión y metadatos de autenticación procesados por
          nuestro proveedor de infraestructura.
        </LI>
      </UL>
      <P>
        No recopilamos categorías especiales de datos personales (p. ej., salud, origen racial, religión).
      </P>

      <SectionTitle>4. Base jurídica del tratamiento</SectionTitle>
      <P>
        Tratamos tus datos personales con las siguientes bases jurídicas previstas en el artículo 6 del
        RGPD:
      </P>
      <UL>
        <LI>
          <strong>Ejecución del contrato (art. 6.1.b):</strong> el tratamiento es necesario para prestarte
          el servicio de tarjetas de fidelización que contrataste.
        </LI>
        <LI>
          <strong>Consentimiento (art. 6.1.a):</strong> has aceptado expresamente estos Términos al crear
          tu cuenta.
        </LI>
        <LI>
          <strong>Interés legítimo (art. 6.1.f):</strong> prevención del fraude, seguridad e integridad
          del Servicio.
        </LI>
      </UL>

      <SectionTitle>5. Cómo utilizamos tus datos</SectionTitle>
      <P>Tus datos personales se utilizan exclusivamente para:</P>
      <UL>
        <LI>Prestar el servicio de tarjetas de fidelización (seguimiento de sellos y premios).</LI>
        <LI>Autenticar tu identidad y mantener tu sesión activa.</LI>
        <LI>Enviarte correos electrónicos transaccionales (confirmación de cuenta, restablecimiento de contraseña).</LI>
        <LI>Prevenir el fraude y garantizar la seguridad del Servicio.</LI>
      </UL>
      <P>
        No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines de marketing o
        publicidad.
      </P>

      <SectionTitle>6. Conservación de los datos</SectionTitle>
      <P>
        Conservamos tus datos personales mientras tu cuenta esté activa. El historial de sellos y las
        premios se mantienen como parte del servicio de fidelización durante la vida de tu cuenta.
        Tras la eliminación de la cuenta, todos los datos personales se borran de forma permanente e
        irreversible en un plazo de 30 días.
      </P>

      <SectionTitle>7. Tus derechos según el RGPD</SectionTitle>
      <P>
        Como residente de la Unión Europea o del Espacio Económico Europeo, tienes los siguientes derechos
        sobre tus datos personales:
      </P>
      <UL>
        <LI>
          <strong>Derecho de acceso (art. 15):</strong> solicitar una copia de los datos que tenemos sobre
          ti.
        </LI>
        <LI>
          <strong>Derecho de rectificación (art. 16):</strong> solicitar la corrección de datos inexactos
          o incompletos.
        </LI>
        <LI>
          <strong>Derecho de supresión (art. 17):</strong> solicitar la eliminación de tus datos personales
          ("derecho al olvido").
        </LI>
        <LI>
          <strong>Derecho a la limitación del tratamiento (art. 18):</strong> solicitar que limitemos el
          tratamiento de tus datos en determinadas circunstancias.
        </LI>
        <LI>
          <strong>Derecho a la portabilidad (art. 20):</strong> recibir tus datos personales en un formato
          estructurado y legible por máquina.
        </LI>
        <LI>
          <strong>Derecho de oposición (art. 21):</strong> oponerte al tratamiento basado en interés
          legítimo.
        </LI>
        <LI>
          <strong>Derecho a retirar el consentimiento (art. 7.3):</strong> retirar tu consentimiento en
          cualquier momento sin que ello afecte a la licitud del tratamiento anterior.
        </LI>
      </UL>
      <P>
        Para ejercer cualquiera de estos derechos, contáctanos en{' '}
        <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
          privacy@loyaltycards.app
        </a>
        . Responderemos en un plazo máximo de 30 días naturales.
      </P>

      <SectionTitle>8. Cómo eliminar tu cuenta y tus datos</SectionTitle>
      <P>
        Puedes solicitar la eliminación completa de tu cuenta y todos los datos personales asociados en
        cualquier momento y de forma gratuita. Para hacerlo:
      </P>
      <UL>
        <LI>
          Envía un correo electrónico a{' '}
          <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
            privacy@loyaltycards.app
          </a>{' '}
          con el asunto <strong>"Solicitud de eliminación de cuenta"</strong>.
        </LI>
        <LI>Incluye la dirección de correo electrónico asociada a tu cuenta.</LI>
        <LI>
          Tu cuenta y todos los datos relacionados (nombre, correo, historial de sellos, premios)
          serán eliminados permanentemente en un plazo de 30 días.
        </LI>
      </UL>
      <P>
        La eliminación de la cuenta es irreversible. Estadísticas agregadas y anonimizadas (sin
        información de identificación personal) pueden conservarse con fines operativos.
      </P>

      <SectionTitle>9. Encargados del tratamiento</SectionTitle>
      <P>
        Para operar el Servicio, contamos con los siguientes encargados del tratamiento, todos conformes
        con el RGPD y vinculados por contratos de encargo de tratamiento:
      </P>
      <UL>
        <LI>
          <strong>Supabase</strong> — proporciona infraestructura de base de datos y autenticación.
          Procesa datos de cuenta y tokens de sesión. Supabase admite residencia de datos en la UE y
          es conforme con el RGPD. Consulta su{' '}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline"
          >
            Política de Privacidad
          </a>
          .
        </LI>
        <LI>
          <strong>Google Sign-In</strong> — proveedor opcional de inicio de sesión mediante OAuth. Si
          eliges iniciar sesión con Google, Google procesa tus credenciales de autenticación. Consulta la{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline"
          >
            Política de Privacidad de Google
          </a>
          .
        </LI>
      </UL>
      <P>Ningún otro tercero tiene acceso a tus datos personales.</P>

      <SectionTitle>10. Cookies y almacenamiento de sesión</SectionTitle>
      <P>
        El Servicio utiliza cookies de sesión exclusivamente para mantener tu sesión autenticada. Estas
        cookies son estrictamente necesarias para el funcionamiento del Servicio y no requieren
        consentimiento según la normativa ePrivacy. No se utilizan cookies de seguimiento, publicidad
        ni analítica de terceros.
      </P>

      <SectionTitle>11. Seguridad de los datos</SectionTitle>
      <P>
        Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos personales frente
        a accesos no autorizados, pérdidas accidentales, destrucción o divulgación no autorizada. Las
        contraseñas se almacenan de forma cifrada y nunca en texto plano. Todos los datos se transmiten
        a través de conexiones HTTPS cifradas.
      </P>

      <SectionTitle>12. Transferencias internacionales de datos</SectionTitle>
      <P>
        Tus datos pueden almacenarse en servidores ubicados dentro de la Unión Europea o en países que
        ofrezcan un nivel adecuado de protección de datos reconocido por la Comisión Europea. Cuando se
        realicen transferencias fuera del EEE, se aplicarán las garantías apropiadas (como Cláusulas
        Contractuales Tipo).
      </P>

      <SectionTitle>13. Modificaciones de estos Términos</SectionTitle>
      <P>
        Podemos actualizar estos Términos periódicamente para reflejar cambios en el Servicio o en la
        normativa aplicable. Cuando se realicen cambios sustanciales, te notificaremos por correo
        electrónico o mediante un aviso dentro del Servicio antes de que los cambios entren en vigor.
        El uso continuado del Servicio tras la fecha de entrada en vigor constituye la aceptación de los
        Términos revisados.
      </P>

      <SectionTitle>14. Derecho a presentar una reclamación</SectionTitle>
      <P>
        Si consideras que no hemos tratado tus datos personales de conformidad con el RGPD, tienes
        derecho a presentar una reclamación ante la autoridad de control de tu país de residencia. En
        España, la autoridad competente es la{' '}
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline"
        >
          Agencia Española de Protección de Datos (AEPD)
        </a>
        . Puedes consultar el listado completo de autoridades europeas en{' '}
        <a
          href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline"
        >
          edpb.europa.eu
        </a>
        .
      </P>

      <SectionTitle>15. Contacto</SectionTitle>
      <P>
        Para cualquier pregunta, solicitud o consulta sobre estos Términos o el tratamiento de tus datos
        personales, puedes contactarnos en:{' '}
        <a href="mailto:privacy@loyaltycards.app" className="text-brand-600 underline">
          privacy@loyaltycards.app
        </a>
      </P>
    </>
  )
}

export default async function TermsPage() {
  const locale = await getLocale()
  const isEs = locale === 'es'

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          {isEs ? 'Atrás' : 'Back'}
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {isEs ? 'Términos de Servicio y Privacidad' : 'Terms of Service & Privacy Policy'}
        </h1>
        <p className="text-sm text-gray-400 mb-2">Loyalty Cards</p>

        <hr className="border-gray-100 mb-2" />

        {/* Content */}
        {isEs ? <EsContent /> : <EnContent />}

        <hr className="border-gray-100 mt-10 mb-6" />

        <p className="text-xs text-gray-400 text-center pb-10">
          © {new Date().getFullYear()} Loyalty Cards.{' '}
          {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
        </p>
      </div>
    </main>
  )
}
