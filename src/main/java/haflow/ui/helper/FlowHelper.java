package haflow.ui.helper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import haflow.entity.Edge;
import haflow.entity.Flow;
import haflow.entity.Node;
import haflow.entity.Module;
import haflow.profile.NodeAppearanceProfile;
import haflow.service.FlowService;
import haflow.service.ModuleService;
import haflow.service.NodeAppearanceProfileService;
import haflow.ui.model.EdgeModel;
import haflow.ui.model.FlowBriefModel;
import haflow.ui.model.FlowListModel;
import haflow.ui.model.FlowModel;
import haflow.ui.model.MergeFlowModel;
import haflow.ui.model.MergeFlowResultModel;
import haflow.ui.model.NodeModel;
import haflow.ui.model.PositionModel;
import haflow.ui.model.RemoveFlowModel;
import haflow.ui.model.RemoveFlowResultModel;

@Component
public class FlowHelper {

	private FlowService flowService;
	private ModuleService moduleService;
	private NodeAppearanceProfileService nodeAppearanceProfileService;

	public FlowService getFlowService() {
		return flowService;
	}

	@Autowired
	public void setFlowService(FlowService flowService) {
		this.flowService = flowService;
	}

	public ModuleService getModuleService() {
		return moduleService;
	}

	@Autowired
	public void setModuleService(ModuleService moduleService) {
		this.moduleService = moduleService;
	}

	public NodeAppearanceProfileService getNodeAppearanceProfileService() {
		return nodeAppearanceProfileService;
	}

	@Autowired
	public void setNodeAppearanceProfileService(
			NodeAppearanceProfileService nodeAppearanceProfileService) {
		this.nodeAppearanceProfileService = nodeAppearanceProfileService;
	}

	public FlowListModel getFlowList() {
		List<Flow> flowList = this.getFlowService().getFlowList();
		FlowListModel flowListModel = new FlowListModel();
		flowListModel.setFlows(new ArrayList<FlowBriefModel>());
		for (Flow flow : flowList) {
			FlowBriefModel flowBriefModel = new FlowBriefModel();
			flowBriefModel.setId(flow.getId());
			flowBriefModel.setName(flow.getName());
			flowListModel.getFlows().add(flowBriefModel);
		}
		return flowListModel;
	}

	public FlowModel getFlow(UUID flowId) {
		Flow flow = this.getFlowService().getFlow(flowId);
		if (flow == null) {
			return null;
		}
		FlowModel flowModel = new FlowModel();
		flowModel.setId(flow.getId());
		flowModel.setName(flow.getName());
		flowModel.setNodes(new HashSet<NodeModel>());
		for (Node node : flow.getNodes()) {
			NodeModel nodeModel = new NodeModel();
			NodeAppearanceProfile nodeAppearanceProfile = this
					.getNodeAppearanceProfileService()
					.getNodeAppearanceProfile(node.getId());
			nodeModel.setFlowId(node.getFlow().getId());
			nodeModel.setId(node.getId());
			nodeModel.setModuleId(node.getModule().getId());
			nodeModel.setName(node.getName());
			nodeModel.setPosition(new PositionModel());
			nodeModel.getPosition().setLeft(
					nodeAppearanceProfile.getPositionLeft());
			nodeModel.getPosition().setTop(
					nodeAppearanceProfile.getPositionTop());
			flowModel.getNodes().add(nodeModel);
		}
		flowModel.setEdges(new HashSet<EdgeModel>());
		for (Edge edge : flow.getEdges()) {
			EdgeModel edgeModel = new EdgeModel();
			edgeModel.setFlowId(edge.getFlow().getId());
			edgeModel.setId(edge.getId());
			edgeModel.setSourceNodeId(edge.getSourceNode().getId());
			edgeModel.setTargetNodeId(edge.getTargetNode().getId());
			flowModel.getEdges().add(edgeModel);
		}
		return flowModel;
	}

	public MergeFlowResultModel mergeFlow(UUID flowId, MergeFlowModel model) {
		boolean success = this.doMergeFlow(flowId, model);
		MergeFlowResultModel result = new MergeFlowResultModel();
		result.setFlowId(flowId);
		result.setSuccess(success);
		if (success) {
			result.setMessage("success");
		} else {
			result.setMessage("fail");
		}
		return result;
	}

	public boolean doMergeFlow(UUID flowId, MergeFlowModel model) {
		Set<Node> nodes = new HashSet<Node>();
		Set<Edge> edges = new HashSet<Edge>();
		for (NodeModel nodeModel : model.getNodes()) {
			if (!nodeModel.getFlowId().equals(flowId)) {
				return false;
			}
			Module module = this.getModuleService().getModule(
					nodeModel.getModuleId());
			if (module == null) {
				return false;
			}
			Node node = new Node();
			node.setFlow(null);
			node.setId(nodeModel.getId());
			node.setModule(module);
			node.setName(nodeModel.getName());
			this.getNodeAppearanceProfileService().mergeNodeAppearanceProfile(
					nodeModel.getId(), nodeModel.getPosition().getLeft(),
					nodeModel.getPosition().getTop());
			nodes.add(node);
		}
		for (EdgeModel edgeModel : model.getEdges()) {
			if (!edgeModel.getFlowId().equals(flowId)) {
				return false;
			}
			Edge edge = new Edge();
			edge.setFlow(null);
			edge.setId(edgeModel.getId());
			edge.setSourceNode(new Node());
			edge.getSourceNode().setId(edgeModel.getSourceNodeId());
			edge.setTargetNode(new Node());
			edge.getTargetNode().setId(edgeModel.getTargetNodeId());
			edges.add(edge);
		}
		boolean result = true;
		result = result
				&& this.getFlowService().mergeFlow(flowId, model.getName(),
						nodes, edges);
		result = result
				&& this.getNodeAppearanceProfileService()
						.cleanUpOrphanNodeAppearanceProfiles();
		return result;
	}

	public RemoveFlowResultModel removeFlow(UUID flowId, RemoveFlowModel model) {
		boolean success = this.getFlowService().removeFlow(flowId);
		RemoveFlowResultModel result = new RemoveFlowResultModel();
		result.setFlowId(flowId);
		result.setSuccess(success);
		if (success) {
			result.setMessage("success");
		} else {
			result.setMessage("fail");
		}
		return result;
	}
}
