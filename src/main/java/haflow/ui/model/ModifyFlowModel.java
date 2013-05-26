package haflow.ui.model;

import java.util.List;
import java.util.UUID;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlElementWrapper;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "modifyFlow")
public class ModifyFlowModel {
	private UUID id;
	private String name;
	private List<NodeModel> nodes;
	private List<EdgeModel> edges;

	@XmlElement
	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	@XmlElement
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@XmlElementWrapper(name = "nodes")
	@XmlElement(name = "node")
	public List<NodeModel> getNodes() {
		return nodes;
	}

	public void setNodes(List<NodeModel> nodes) {
		this.nodes = nodes;
	}

	@XmlElementWrapper(name = "edges")
	@XmlElement(name = "edge")
	public List<EdgeModel> getEdges() {
		return edges;
	}

	public void setEdges(List<EdgeModel> edges) {
		this.edges = edges;
	}
}