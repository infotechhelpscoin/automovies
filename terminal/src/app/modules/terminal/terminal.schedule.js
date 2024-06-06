import { exec } from 'child_process';

const task = {
  "_id": {
    "$oid": "6651a34a9d5397d580e01f66"
  },
  "commands": [
    "npm install expr123",
    "npm install react",
    "npm install mongodb"
  ],
  "errorCommand": "npm install express",
  "status": "pending",
  "createdAt": {
    "$date": "2024-05-25T08:37:30.656Z"
  },
  "__v": 0
};

const commands = task.commands;
const errorCommand = task.errorCommand;
let status = "pending";

function runCommand(command, index, step, callback) {
  exec(command, (error, stdout, stderr) => {
    if (error || stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('err')) {
      console.error(`Step ${step}: Error executing command: ${command}`, error || stderr);
      callback(false);
    } else {
      console.log(`Step ${step}: Command executed successfully: ${command}`, stdout);
      callback(true);
    }
  });
}

function handleError(step, callback) {
  exec(errorCommand, (error, stdout, stderr) => {
    if (error || stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('err')) {
      console.error(`Step ${step}: Error executing error command: ${errorCommand}`, error || stderr);
      callback(false);
    } else {
      console.log(`Step ${step}: Error command executed successfully: ${errorCommand}`, stdout);
      callback(true);
    }
  });
}

function getCorrectCommand(callback) {
  callback(errorCommand);
}

function executeCommands(commands, index, step) {
  if (index < commands.length) {
    runCommand(commands[index], index, step, (success) => {
      if (success) {
        executeCommands(commands, index + 1, step + 1);
      } else {
        handleError(step, (errorCommandSuccess) => {
          if (errorCommandSuccess) {
            console.log(`Step ${step}: Proceeding to the next command after running error command.`);
            executeCommands(commands, index + 1, step + 1);
          } else {
            console.error(`Step ${step}: Error command failed, aborting.`);
            status = "failed";
          }
        });
      }
    });
  } else {
    console.log(`Step ${step}: All commands executed successfully.`);
    status = "completed";

    // Send Ctrl+D to stop t-rec
    setTimeout(() => {
      exec(`xdotool windowactivate --sync ${process.env.WINDOWID} key ctrl+d`, (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to send Ctrl+D:', error);
        } else {
          console.log('Sent Ctrl+D to stop t-rec.');
        }
      });
    }, 5000); // Adjust the delay if necessary
  }
}

// Start a new gnome-terminal and get its window ID
exec('gnome-terminal &', (error, stdout, stderr) => {
  if (error) {
    console.error('Failed to start gnome-terminal:', error);
    return;
  }

  // Wait a bit to ensure the terminal starts
  setTimeout(() => {
    exec('xdotool search --onlyvisible --class gnome-terminal | tail -1', (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to get new window ID:', error);
        return;
      }

      const newWindowID = stdout.trim();
      console.log(`New window ID: ${newWindowID}`);

      // Export the WINDOWID environment variable
      process.env.WINDOWID = newWindowID;

      // Start recording with t-rec using the new window ID
      const tRecCommand = `t-rec`;
      exec(tRecCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to start t-rec:', error);
          return;
        }

        console.log('Recording started. Run your commands.');

        // Execute the commands while recording
        executeCommands(commands, 0, 1);

        // Stop recording when done
        process.on('exit', () => {
          exec('pkill -f t-rec', (error, stdout, stderr) => {
            if (error) {
              console.error('Failed to stop t-rec:', error);
            } else {
              console.log('Recording stopped.');
            }
          });
        });
      });
    });
  }, 3000); // Adjust the delay if necessary
});
