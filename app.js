// Pega aquí los datos públicos de tu proyecto Supabase (Project URL y anon/publishable key).
const SUPABASE_URL = 'https://szbgisjgvtbypyvseqan.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uZUbot0DpKl3OlRSUK4DpA_HM_i3_Bl';

const form = document.querySelector('#auth-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const message = document.querySelector('#message');
const submitButton = document.querySelector('#submit-button');
const submitLabel = document.querySelector('#submit-label');
const switchModeButton = document.querySelector('#switch-mode');
const switchPrompt = document.querySelector('#switch-prompt');
const modeDescription = document.querySelector('#mode-description');
const authView = document.querySelector('#auth-view');
const dashboard = document.querySelector('#dashboard');
const clientReady = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('PEGA_AQUI') && !SUPABASE_ANON_KEY.includes('PEGA_AQUI');
const supabaseClient = clientReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let isSignUp = false;

function showMessage(text, kind = '') {
  message.textContent = text;
  message.className = `message ${kind}`;
}

function setBusy(busy) {
  submitButton.disabled = busy;
  submitLabel.textContent = busy ? 'Un momento…' : (isSignUp ? 'Crear cuenta' : 'Iniciar sesión');
}

function renderSession(session) {
  authView.classList.toggle('hidden', Boolean(session));
  dashboard.classList.toggle('hidden', !session);
  document.querySelector('#user-email').textContent = session?.user?.email ?? '';
}

switchModeButton.addEventListener('click', () => {
  isSignUp = !isSignUp;
  submitLabel.textContent = isSignUp ? 'Crear cuenta' : 'Iniciar sesión';
  switchPrompt.textContent = isSignUp ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?';
  switchModeButton.textContent = isSignUp ? 'Iniciar sesión' : 'Crear cuenta';
  modeDescription.textContent = isSignUp ? 'Crea tu cuenta para empezar.' : 'Ingresa tus datos para continuar.';
  passwordInput.autocomplete = isSignUp ? 'new-password' : 'current-password';
  showMessage('');
});

document.querySelector('#toggle-password').addEventListener('click', (event) => {
  const visible = passwordInput.type === 'text';
  passwordInput.type = visible ? 'password' : 'text';
  event.currentTarget.textContent = visible ? 'Ver' : 'Ocultar';
  event.currentTarget.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('');
  if (!clientReady) {
    showMessage('Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY en app.js.');
    return;
  }
  if (!form.reportValidity()) return;

  setBusy(true);
  const credentials = { email: emailInput.value.trim(), password: passwordInput.value };
  const result = isSignUp
    ? await supabaseClient.auth.signUp(credentials)
    : await supabaseClient.auth.signInWithPassword(credentials);
  setBusy(false);

  if (result.error) {
    showMessage(result.error.message);
    return;
  }
  if (isSignUp && !result.data.session) {
    showMessage('Cuenta creada. Revisa tu correo para confirmar el registro.', 'success');
    return;
  }
  renderSession(result.data.session);
});

document.querySelector('#sign-out').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) showMessage(error.message);
  else {
    renderSession(null);
    showMessage('Has cerrado sesión.', 'success');
  }
});

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) showMessage(error.message);
    else if (data.session) renderSession(data.session);
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => renderSession(session));
}
