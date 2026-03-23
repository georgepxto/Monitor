# MonitorHub

Sistema de monitoramento de status em tempo real para integrações de infraestrutura, sistemas e bancos (PIX). Desenvolvido com uma arquitetura Monorepo (Node.js no Backend e React/Vite no Frontend).

## 🚀 Como Configurar em Outro Dispositivo

Siga os passos abaixo para rodar o projeto do zero em qualquer máquina:

### 1. Clonar o Repositório

Abra o terminal e baixe os arquivos mais recentes do GitHub:

```bash
git clone https://github.com/georgepxto/Monitor.git
cd Monitor
```

### 2. Configurar o Backend (Servidor)

O servidor Node.js é responsável por fazer o scraping das notícias e consultar as APIs de status (AWS, Statuspage, Google News).

```bash
cd server
npm install
node index.js
```

O backend vai rodar na porta `3001` (http://localhost:3001).

_(Deixe este terminal aberto em segundo plano rodando o servidor)._

### 3. Configurar o Frontend (Cliente)

Abra um **novo terminal** (mantenha o do backend rodando) e navegue até a pasta do cliente para rodar o painel em React:

```bash
cd client
npm install
npm run dev
```

O frontend vai rodar e disponibilizar a interface moderna na porta `5173` (ou similar).
Basta abrir no navegador: **`http://localhost:5173`**

---

### Estrutura do Projeto

- `/server`: Lógica de rotas, API interna e fetchers (`express`, `axios`, `rss-parser`).
  - O script principal de extração está em `/server/services/fetchers.js`.
- `/client`: Interface de usuário (`React`, `Vite`, `Tailwind CSS`).
  - Os componentes principais estão em `/client/src/components/`, especialmente o `StatusCard.tsx` e o `StatusDashboard.tsx`.

### Informações Importantes

- **CORS:** O backend está configurado para aceitar requests do `localhost:5173`.
- **Notícias:** A extração de notícias utiliza o Google News RSS para consultar informações em tempo real sobre instabilidades e exibir até 3 resultados relacionados.
