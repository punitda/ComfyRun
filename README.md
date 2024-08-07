# Modal ComfyUI Deploy

Run your ComfyUI workflows at blazing fast speed 🏎️ on the cloud GPUs powered by [Modal](https://modal.com/).

Stop breaking your local ComfyUI environment setups when experimenting with new ideas 💡 or waiting for 🐌 slow builds to run on your machines.

A fully open source and self hosted solution to run your workflows on the powerful GPUs

## App Screenshots

![Create App Screenshot](./screenshots/app/create-app-page.png)

![Apps Screenshot](./screenshots/app/apps-page.png)

![Workflow Screenshot](./screenshots/app/workflow-page.png)

## Requirements

Local Dev

- Node - `>=v20.x.x`
- Python - `>=3.10.x`
- Docker

For running self hosted solution, please sign-up for following services:

- [Modal account](https://modal.com/) - Running workflows
- [Clerk account](https://clerk.com/) - Authentication
- [Fly.io account](https://fly.io/) - Hosting

## Local Setup

### Frontend

Pre-requisites

- Node >v20.x.x - recommend to install via some node version manager like [nvm](https://github.com/nvm-sh/nvm) or [n](https://github.com/tj/n)

Once the node is installed, please run below commands to install and run the app locally

#### Change directory:

```sh
cd web
```

#### Install dependencies:

```sh
npm install
```

#### Setup Environment variables:

Create `.env.` file from `.env.sample` and add required keys(more info below how to get them)

```
cp .env.sample .env
```

#### Run app

```sh
npm run dev
```

### Backend

Pre-requisites

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) to avoid messing with Python virtual environment
- Install [Modal Client]()

#### Change directory:

```sh
cd backend
```

#### Setup Environment variables:

Create `.env.` file from `.env.sample` and add required keys(more info below how to get them)

```
cp .env.sample .env
```

#### Run app

```sh
docker-compose -f docker-compose.local.yml up --build
```

> Note: Make sure docker desktop is running before running this command
