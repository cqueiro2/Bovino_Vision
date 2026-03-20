<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ea72f87a-1c85-4557-9a62-c8454940df2b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Teste do processo online/offline no desenvolvimento

1. Inicie o projeto com `npm run dev`.
2. Abra `http://localhost:3000` e vá para **Análise**.
3. No navegador, abra **DevTools > Network** e marque **Offline**.
4. Faça upload/captura de imagem e clique em **ANALISAR AGORA** para enfileirar offline.
5. Volte para **Online** no DevTools.
6. O sistema processa automaticamente as pendências; você também pode usar o botão **Processar pendências**.
