import TerminalService from "./terminal.service.js";

const createRequest = async (req, res) => {
  console.log('create request route hit')
  try {
    const { successCommand, errorCommand } = req.body;  // Corrected spelling

    const newRequest = await TerminalService.createTerminalRequest(successCommand, errorCommand);

    res.status(200).json({
      success: true,
      message: "Request saved successfully",
      data: newRequest
    });
    
  } catch (error) {
    console.error(`Error in saving request ${error}`);
    res.status(500).json({
      success: false,
      message: "Request failed to save",
      data: error
    });
  }
};

export default {
  createRequest
};
