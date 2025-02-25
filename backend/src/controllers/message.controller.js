import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId, io } from '../lib/socket.js';

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

    // filter out the logged in user from the list of users means return all user except the logged in user(current user)
        const filteredUser = await User.find({_id: {$ne: loggedInUserId}}).select("-password"); // select("-password") means don't select password field from user
     
        res.status(200).json(filteredUser);
    } catch (error) {
        console.log("Error in getUserForSidebar controller", error.message);
        res.status(500).json({message: 'Internal server error'});
    }
};

export const getMessages = async (req, res) => {
    try {
      const { id: userToChatId } = req.params;
      const myId = req.user._id;
  
      const messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      });
  
      res.status(200).json(messages);
    } catch (error) {
      console.log("Error in getMessages controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id : receiverId} = req.params;
        const senderId = req.user._id;

        let imageURL;
        if(image){
            // upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageURL = uploadResponse.secure_url;
            console.log("checking"+imageURL)
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageURL
        });

        await newMessage.save();
        
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
          io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({message: 'Internal server error'});
        
    }
};