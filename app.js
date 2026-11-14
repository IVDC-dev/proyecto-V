// La clave publishable es pública; la validación de credenciales ocurre en la Edge Function.
const SUPABASE_URL = 'https://hypxybgvxvpwfqflijty.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_x6A2XiGzM9F2Qlk9xwBUvA_UK3HoJJz';

const form = document.querySelector('#auth-form');
const usernameInput = document.querySelector('#usuario');
const passwordInput = document.querySelector('#password');
const message = document.querySelector('#message');
const submitButton = document.querySelector('#submit-button');
const submitLabel = document.querySelector('#submit-label');
const authView = document.querySelector('#auth-view');
const dashboard = document.querySelector('#dashboard');
const clientReady = SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.includes('PEGA_AQUI');
const sb = clientReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function showMessage(text, kind = '') {
  message.textContent = text;
  message.className = `message ${kind}`;
}

function setBusy(busy) {
  submitButton.disabled = busy;
  submitLabel.textContent = busy ? 'Validando…' : 'Iniciar sesión';
}

function showDashboard(username) {
  authView.classList.add('hidden');
  dashboard.classList.remove('hidden');
  document.querySelector('#user-name').textContent = username;
}

async function getFunctionErrorMessage(error) {
  let detail = error.message || 'No se pudo validar el usuario.';
  try {
    if (error.context && typeof error.context.json === 'function') {
      const responseBody = await error.context.json();
      detail = responseBody.message || responseBody.error || detail;
    }
  } catch {
    // Conserva el mensaje de error original si la respuesta no contiene JSON.
  }
  return detail;
}

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
    showMessage('Falta configurar la conexión con Supabase en app.js.');
    return;
  }
  if (!form.reportValidity()) return;

  setBusy(true);
  try {
    const { data, error } = await sb.functions.invoke('login-aunar', {
      body: {
        usuario: usernameInput.value.trim(),
        password: passwordInput.value
      }
    });

    if (error) {
      showMessage(await getFunctionErrorMessage(error));
      return;
    }
    if (!data || data.success === false || data.authenticated === false || data.ok === false || data.error) {
      showMessage(data?.message || data?.error || 'Usuario o contraseña incorrectos.');
      return;
    }

    const returnedUsername = typeof data.usuario === 'string' ? data.usuario : usernameInput.value.trim();
    showDashboard(returnedUsername);
  } catch (error) {
    showMessage(error.message || 'No fue posible conectar con el servicio de inicio de sesión.');
  } finally {
    setBusy(false);
  }
});

document.querySelector('#sign-out').addEventListener('click', () => {
  dashboard.classList.add('hidden');
  authView.classList.remove('hidden');
  passwordInput.value = '';
  showMessage('Has cerrado la vista de sesión.', 'success');
});
