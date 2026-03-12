// Script para generar el hash bcrypt de la contraseña del panel admin
// Uso: node scripts/generate-admin-hash.js
// Luego copiá el hash generado como valor de ADMIN_PASSWORD_HASH en Vercel

const bcrypt = require("bcrypt");
const readline = require("readline");

// Pide una contraseña ocultando los caracteres (compatible con Windows)
function askPassword(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Escribir el prompt manualmente
    process.stdout.write(prompt);

    // Suprimir el echo de caracteres usando _writeToOutput
    rl._writeToOutput = () => {};

    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  console.log("\n🔐 Generador de hash para contraseña del panel admin\n");

  const password = await askPassword("Ingresá la nueva contraseña: ");
  const confirmar = await askPassword("Confirmá la contraseña:    ");

  if (password !== confirmar) {
    console.error("\n❌ Las contraseñas no coinciden. Intentá de nuevo.\n");
    process.exit(1);
  }

  if (password.length < 8) {
    console.warn(
      "\n⚠️  Advertencia: la contraseña tiene menos de 8 caracteres.\n"
    );
  }

  console.log("\n⏳ Generando hash (salt rounds: 12)...\n");

  const hash = await bcrypt.hash(password, 12);

  console.log("✅ Hash generado exitosamente:\n");
  console.log("─────────────────────────────────────────────────────────────");
  console.log(hash);
  console.log("─────────────────────────────────────────────────────────────");
  console.log("\n📋 Copiá ese hash y configuralo en Vercel como:");
  console.log("   Variable: ADMIN_PASSWORD_HASH");
  console.log("   Valor:    (el hash de arriba)\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
