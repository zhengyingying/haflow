package haflow.ui.model;

import java.util.Date;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "flowRunHistory")
public class FlowRunHistoryModel {
	private int id;
	private String oozieJobId;
	private String commitMessage;
	private Date timestamp;
	
	@XmlElement
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	
	@XmlElement
	public String getOozieJobId() {
		return oozieJobId;
	}
	public void setOozieJobId(String oozieJobId) {
		this.oozieJobId = oozieJobId;
	}
	
	@XmlElement
	public String getCommitMessage() {
		return commitMessage;
	}
	public void setCommitMessage(String commitMessage) {
		this.commitMessage = commitMessage;
	}
	
	@XmlElement
	public Date getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(Date timestamp) {
		this.timestamp = timestamp;
	}

}
