import jwt from "jsonwebtoken";

export const generateJWTToken = (user, message, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  return res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
      maxAge: Number(process.env.COOKIE_EXPIRE),
      sameSite: "None",
      secure: process.env.NODE_ENV === "production" ? true : false,
    })
    .json({
      success: true,
      message,
      token,
    });
};
