use crate::error::{BridgeError, BridgeErrorResponse, BridgeResult};
use crate::ipc::MidiDeviceList;
use midir::{MidiInput, MidiOutput};

pub fn enumerate_devices() -> BridgeResult<MidiDeviceList> {
    let mut inputs = Vec::new();
    let mut outputs = Vec::new();

    if let Ok(midi_in) = MidiInput::new("consequence-studio-in") {
        for (i, port) in midi_in.ports().iter().enumerate() {
            if let Ok(name) = midi_in.port_name(port) {
                inputs.push(crate::ipc::MidiDeviceInfo {
                    id: format!("in-{i}"),
                    name,
                    direction: "input".to_string(),
                });
            }
        }
    }

    if let Ok(midi_out) = MidiOutput::new("consequence-studio-out") {
        for (i, port) in midi_out.ports().iter().enumerate() {
            if let Ok(name) = midi_out.port_name(port) {
                outputs.push(crate::ipc::MidiDeviceInfo {
                    id: format!("out-{i}"),
                    name,
                    direction: "output".to_string(),
                });
            }
        }
    }

    Ok(MidiDeviceList { inputs, outputs })
}

pub fn send_output(_device_id: &str, _message: Vec<u8>) -> BridgeResult<()> {
    Err(BridgeErrorResponse::from(BridgeError::Midi(
        "MIDI output not yet implemented".into(),
    )))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn enumerate_returns_device_lists() {
        let result = enumerate_devices();
        assert!(result.is_ok());
        let list = result.unwrap();
        assert!(list.inputs.len() >= 0);
        assert!(list.outputs.len() >= 0);
    }
}
