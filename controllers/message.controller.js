import { v2 as cloudinary } from "cloudinary";
import { catchAsyncError } from "../middlewares/catchAsyncError.middleware.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

import { getIO, getReceiverSocketId } from "../utils/socket.js";

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const filteredUsers = await User.find({ _id: { $ne: user } }).select(
    "-password",
  );
  res.status(200).json({
    success: true,
    users: filteredUsers,
  });
});
export const getMessages = catchAsyncError(async (req, res, next) => {
  const receiverId = req.params.id;
  const myId = req.user._id;
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(400).json({
      success: false,
      message: "Receiver Id Is Invalid",
    });
  }

  const message = await Message.find({
    $or: [
      { senderId: myId, receiverId: receiverId },
      { senderId: receiverId, receiverId: myId },
    ],
  }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    message,
  });
});
export const sendMessage = catchAsyncError(async (req, res, next) => {
  const { text } = req.body;
  const media = req.files?.media;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(400).json({
      success: false,
      message: "Receiver Id Is Invalid",
    });
  }

  const sanitizedText = text.trim() || "";
  if (!sanitizedText && !media) {
    return res.status(400).json({
      success: false,
      message: "Can not sent empty message",
    });
  }

  let mediaUrl = "";
  if (media) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(
        media.tempFilePath,
        {
          resouse_type: "auto", // auto detect image/video
          folder: "CHAT_APP_MEDIA",
          transformation: [
            {
              width: 1080,
              height: 1080,
              crop: "limit",
            },
            {
              quality: "auto:eco",
            },
            {
              fetch_format: "auto",
            },
          ],
        },
      );
      mediaUrl = uploadResponse.secure_url;
    } catch (error) {
      console.log("Cloudinary Upload Error", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    text: sanitizedText,
    media: mediaUrl,
  });

  const receiverSocketId = getReceiverSocketId(receiverId);

  const io = getIO();

  const senderSocketId = getReceiverSocketId(senderId);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("NewMessage", newMessage);
  }

  if (senderSocketId) {
    io.to(senderSocketId).emit("NewMessage", newMessage);
  }

  res.status(201).json({
    newMessage,
  });
});
