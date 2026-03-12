
# DEPLOYMENT_GUIDE.md is no longer needed

The primary and recommended deployment method for this project is using **Vercel**, as it provides the most seamless experience for Next.js applications and includes integrated PostgreSQL database hosting.

The full, up-to-date instructions for deploying to Vercel are now located in the main **`README.md`** file. Please refer to that guide for deploying your application.

If you have a specific need to deploy to a different environment (like a traditional VPS), the principles remain similar:
1.  Set up a server with Node.js.
2.  Set up a PostgreSQL database.
3.  Clone your repository.
4.  Create a `.env.local` file with your production environment variables (`POSTGRES_URL`, `MERCADOPAGO_ACCESS_TOKEN`, etc.).
5.  Run `npm install`, `npm run build`, and use a process manager like `pm2` to run `npm start`.
6.  Configure a reverse proxy (like Nginx) and set up an SSL certificate.

However, for simplicity, reliability, and speed, the Vercel deployment guide in `README.md` is the official recommended path.
