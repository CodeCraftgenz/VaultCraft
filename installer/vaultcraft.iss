; VaultCraft — Inno Setup Installer Script
; Gera instalador .exe profissional para Windows
;
; Pré-requisitos:
;   1. Compilar o app: npm run tauri build
;   2. O .exe estará em: src-tauri\target\release\vaultcraft.exe
;   3. Instalar Inno Setup: https://jrsoftware.org/isinfo.php
;   4. Abrir este .iss no Inno Setup Compiler e compilar
;
; Output: installer\Output\VaultCraft-Setup-{version}.exe

#define MyAppName "VaultCraft"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "VaultCraft"
#define MyAppURL "https://vaultcraft.app"
#define MyAppExeName "vaultcraft.exe"
#define MyAppDescription "Cofre pessoal para documentos, notas e checklists — 100% offline"

[Setup]
; Identificador único do app (GUID de produção)
AppId={{A1B2C3D4-5E6F-7A8B-9C0D-E1F2A3B4C5D6}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
; Sem privilégio de admin necessário (instala para o usuário)
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=Output
OutputBaseFilename=VaultCraft-Setup-{#MyAppVersion}
SetupIconFile=..\src-tauri\icons\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
DiskSpanning=no
; Imagens do wizard (usar V no lugar do D)
WizardImageFile=wizard-image.bmp
WizardSmallImageFile=wizard-small.bmp
; Versão Windows mínima: Windows 10
MinVersion=10.0
; Desinstalar
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
; Permitir que o usuário escolha o diretório
DisableDirPage=no
; Mostrar progresso
ShowLanguageDialog=auto

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startupicon"; Description: "Iniciar {#MyAppName} com o Windows"; GroupDescription: "Opções adicionais:"; Flags: unchecked

[Files]
; Executável principal (gerado pelo Tauri build)
Source: "..\src-tauri\target\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Comment: "{#MyAppDescription}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; Comment: "{#MyAppDescription}"

[Registry]
; Iniciar com o Windows (se selecionado)
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#MyAppName}"; ValueData: """{app}\{#MyAppExeName}"" --minimized"; Flags: uninsdeletevalue; Tasks: startupicon

[Run]
; Executar o app após instalação
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Fechar o app antes de desinstalar
Filename: "{cmd}"; Parameters: "/C taskkill /IM {#MyAppExeName} /F"; Flags: runhidden

[Code]
// Verificar se WebView2 está instalado
function NeedsWebView2(): Boolean;
var
  RegKey: String;
begin
  Result := True;
  // per-machine 64-bit
  RegKey := 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  if RegKeyExists(HKLM, RegKey) then begin
    Result := False;
    Exit;
  end;
  // per-machine 32-bit
  RegKey := 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  if RegKeyExists(HKLM, RegKey) then begin
    Result := False;
    Exit;
  end;
  // per-user
  if RegKeyExists(HKCU, RegKey) then begin
    Result := False;
    Exit;
  end;
end;

// Fechar o app se estiver rodando antes de instalar
function CloseRunningApp(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  Exec(ExpandConstant('{cmd}'), '/C taskkill /IM {#MyAppExeName} /F', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

// Instalar WebView2 se necessário
procedure InstallWebView2();
var
  ResultCode: Integer;
  BootstrapperPath: String;
begin
  if not NeedsWebView2() then
    Exit;

  // Verificar se o bootstrapper foi embutido
  BootstrapperPath := ExpandConstant('{tmp}\MicrosoftEdgeWebview2Setup.exe');
  if FileExists(BootstrapperPath) then begin
    Exec(BootstrapperPath, '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exit;
  end;

  // Se não embutido, informar o usuário
  if MsgBox('O WebView2 é necessário para executar o {#MyAppName}.' + #13#10 +
            'Na maioria dos PCs com Windows 10/11 ele já está instalado (via Microsoft Edge).' + #13#10#13#10 +
            'Se o app não abrir após a instalação, baixe o WebView2 em:' + #13#10 +
            'https://developer.microsoft.com/microsoft-edge/webview2/' + #13#10#13#10 +
            'Deseja continuar a instalação?',
            mbInformation, MB_YESNO) = IDNO then
    Abort;
end;

// Verificação antes de instalar
function InitializeSetup(): Boolean;
begin
  Result := True;
  CloseRunningApp();
end;

// Após instalar arquivos, verificar WebView2
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then begin
    InstallWebView2();
  end;
end;

// Perguntar se deseja remover dados do usuário na desinstalação
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    if MsgBox('Deseja remover também os dados e configurações do {#MyAppName}?' + #13#10 +
              '(documentos, notas, checklists e configurações serão apagados)',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      DelTree(ExpandConstant('{localappdata}\com.vaultcraft.app'), True, True, True);
    end;
  end;
end;
