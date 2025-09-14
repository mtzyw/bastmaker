module.exports = {
  extends: "next/core-web-vitals",
  rules: {
    "react-hooks/exhaustive-deps":
      process.env.NODE_ENV === "production" ? "off" : "warn",
  },
};
