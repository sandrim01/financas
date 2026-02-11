# Finanças App

Uma aplicação moderna de gerenciamento financeiro pessoal.

## Funcionalidades

- **Dashboard**: Visão geral do saldo, receitas e despesas com gráficos interativos.
- **Transações**: Adicione, edite e remova transações com categorização.
- **Relatórios**: visualize a distribuição de gastos por categoria.
- **Modo Escuro**: Interface moderna e elegante com glassmorphism.

## Instalação e Execução

### Pré-requisitos
- Node.js instalado (v16 ou superior)

### Passos

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute em modo de desenvolvimento (Hot Reload):
   ```bash
   npm run electron:dev
   ```

3. Gere o instalador para Windows (.exe):
   ```bash
   npm run electron:build
   ```
   O instalador será criado na pasta `release`.

## Estrutura do Projeto

- `src/`: Código fonte da interface React.
- `electron/`: Código do processo principal do Electron.
- `dist/`: Arquivos compilados do React.
- `release/`: Instaladores gerados.

## Tecnologias

- Electron
- React + Vite
- Tailwind CSS
- Recharts
- Framer Motion
- Electron Store (Persistência de dados local JSON)
