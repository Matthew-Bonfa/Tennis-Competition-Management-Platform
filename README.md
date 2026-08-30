# Tennis-Competition-Management-Platform

To get the project working properly, ensure you have node, node package manager (npm) and npx installed. You can clone the repository and run "npm i" from command in the root directory of the repository to install the necessary packages to local. 

For the backend setup, you will need to download docker and have the docker app open in the background. You can run command "docker compose up -d" from the root directory to have the postgreSQL db running. Currently the project is setup with Prisma for creating easy schemas for the db, but we can change this if it is causing a headache. For prisma, we need to run "npx prisma contract emit"

Useful commands when working docker are:
"docker compose down -v" to delete the current volume, essentially wiping the db to a clean slate

When we update the backend schema and want to push the changes onto the db, we can run these commands from the backend directory:
"npx prisma contract emit"
"npx prisma migration plan --name add_new_feature"
"npx prisma db migrate --advance-ref db"

The .env file DATABASE_URL will need to match with the settings in the docker-compose.yml file to work properly, make sure to never commit this file to the repository and also never commit any module files, but these are already in .gitignore already so don't stress.
