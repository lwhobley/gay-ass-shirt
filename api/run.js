module.exports = async function(req, res) {
  if (req.query.secret !== "gas-setup-2024") return res.status(401).end("Unauthorized");
  var token = process.env.PRINTIFY_API_KEY;
  var shop = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shop) return res.status(500).json({ error: "Missing env vars" });
  var BASE = "https://raw.githubusercontent.com/lwhobley/gay-ass-shirt/main/designs/";
  var h = { "Authorization": "Bearer " + token, "Content-Type": "application/json", "User-Agent": "GASSite/1.0" };

  var testFile = "IMG_1832.png";
  var fullError = "";
  var fullResponse = {};

  try {
    var r1 = await fetch("https://api.printify.com/v1/uploads/images.json", {
      method: "POST", headers: h,
      body: JSON.stringify({ file_name: testFile, url: BASE + testFile })
    });
    fullResponse = await r1.json();
    fullError = JSON.stringify(fullResponse);
  } catch(e1) {
    fullError = e1.message;
  }

  return res.status(200).json({ url_tested: BASE + testFile, status: fullError, full: fullResponse });
};
