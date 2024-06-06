import { Request } from "./terminal.model.js";

const createTerminalRequest = async (successCommand, errorCommand) => {
  try {
    // Ensure successCommand is an array of strings
    const commands = JSON.parse(successCommand);

    const newRequest = new Request({
      commands,
      errorCommand,
      status: "pending"
    });
    await newRequest.save();
    return newRequest;
  } catch (error) {
    throw new Error(`Error in saving request ${error}`);
  }
};

export default {
  createTerminalRequest
};
