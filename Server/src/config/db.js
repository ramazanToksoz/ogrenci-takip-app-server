const mongoose = require("mongoose");
mongoose
  .connect(process.env.DB_URL, {})
  .then((res) => {
    console.log("db baglandı");
  })
  .catch((err) => {
    console.log("baglantı basarısız", err);
  });
