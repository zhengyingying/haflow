package haflow.ui.model;

import java.util.UUID;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "mergeFlowResult")
public class MergeFlowResultModel {
	private boolean success;
	private UUID flowId;
	private String message;

	@XmlElement
	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	@XmlElement
	public UUID getFlowId() {
		return flowId;
	}

	public void setFlowId(UUID flowId) {
		this.flowId = flowId;
	}

	@XmlElement
	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
}
