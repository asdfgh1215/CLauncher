const $ = id => document.getElementById(id);
let versions = [];
function log(message) { $('log').textContent = String(message) + '\n' + $('log').textContent.slice(0, 3500); }
function setState(value) { $('stateLabel').textContent = value; }
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('hidden', p.id !== name));
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  $('pageTitle').textContent = ({home:'Добро пожаловать!',versions:'Версии Minecraft',mods:'Моды и дополнения',settings:'Настройки'})[name];
}
document.querySelectorAll('.nav').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
$('ram').addEventListener('input', e => $('ramValue').textContent = e.target.value);
$('fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen?.());
async function loadVersions() {
  try {
    setState('Получение версий…');
    versions = await window.clg.listVersions();
    const latest = versions.find(v => v.type === 'release');
    if (latest) $('versionSelect').value = latest.id;
    $('versionSelect').innerHTML = `<option value="${latest?.id || 'release'}">Последняя Release (${latest?.id || '…'})</option>` +
      versions.slice(0, 120).map(v => `<option value="${v.id}">${v.id} — ${v.type}</option>`).join('');
    renderVersions(versions);
    setState('Готово');
  } catch (e) { log('Не удалось получить манифест версий: ' + e.message); $('versionList').textContent = 'Нет соединения. Повторите попытку позже.'; }
}
function renderVersions(list) {
  $('versionList').innerHTML = list.slice(0, 300).map(v => `<div class="version-row" data-version="${v.id}"><div><b>${v.id}</b><br><small>${v.type} · ${new Date(v.releaseTime).toLocaleDateString()}</small></div><button>Выбрать</button></div>`).join('');
  document.querySelectorAll('.version-row').forEach(row => row.addEventListener('click', () => {
    $('versionSelect').value = row.dataset.version; showPage('home'); log('Выбрана версия ' + row.dataset.version);
  }));
}
$('refreshVersions').addEventListener('click', loadVersions);
$('versionSearch').addEventListener('input', e => renderVersions(versions.filter(v => v.id.toLowerCase().includes(e.target.value.toLowerCase()))));
$('playBtn').addEventListener('click', async () => {
  const username = $('username').value.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) { log('Ник должен содержать 3–16 символов: латинские буквы, цифры или _.'); return; }
  const options = { username, version: $('versionSelect').value, ram: Number($('ram').value) };
  try {
    await window.clg.saveSettings(options);
    setState('Запуск / загрузка…'); $('progressBar').style.width = '8%';
    log(`Подготовка Minecraft ${options.version} для ${username}…`);
    const result = await window.clg.launch(options);
    log('Запуск начат: ' + JSON.stringify(result)); setState('Игра запущена');
  } catch (e) { setState('Ошибка'); log('Ошибка запуска: ' + e.message); $('progressBar').style.width = '0'; }
});
window.clg.onLog(message => log(message));
window.clg.onProgress(progress => {
  const value = progress?.百分比 ?? progress?.percent ?? progress?.task ?? 0;
  if (typeof value === 'number') $('progressBar').style.width = Math.max(0, Math.min(100, value)) + '%';
});
window.clg.onClosed(code => { setState('Игра закрыта'); log('Minecraft завершил работу. Код: ' + code); });
$('folderBtn').addEventListener('click', () => window.clg.openGameFolder());
$('folderBtn2').addEventListener('click', () => window.clg.openGameFolder());
$('saveSettings').addEventListener('click', async () => {
  const value = { username: $('settingsUsername').value, version: $('versionSelect').value, ram: Number($('settingsRam').value) };
  await window.clg.saveSettings(value); $('username').value = value.username; $('ram').value = value.ram; $('ramValue').textContent = value.ram; $('profileName').textContent = value.username; log('Настройки сохранены.');
});
(async () => {
  const settings = await window.clg.getSettings();
  $('username').value = settings.username || 'Player'; $('profileName').textContent = settings.username || 'Player';
  $('ram').value = settings.ram || 4; $('ramValue').textContent = settings.ram || 4;
  $('settingsUsername').value = settings.username || 'Player'; $('settingsRam').value = settings.ram || 4;
  const java = await window.clg.checkJava();
  $('javaStatus').textContent = java.installed ? 'Java обнаружена: ' + java.version : java.message;
  await loadVersions();
})();
