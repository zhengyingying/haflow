package haflow.service;

import haflow.entity.Flow;
import haflow.entity.Node;
import haflow.flow.DirectedGraph;
import haflow.flow.TopologicalSort;
import haflow.module.ModuleMetadata;
import haflow.module.oozie.EndModule;
import haflow.module.oozie.StartModule;
import haflow.profile.NodeConfiguration;
import haflow.ui.model.RunFlowResultModel;
import haflow.utility.ClusterConfiguration;
import haflow.utility.ModuleLoader;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class FlowExecuteService {

	private ModuleLoader moduleLoader;
	private NodeConfigurationService nodeConfigurationService;
	private ClusterConfiguration clusterConfiguration;
	private HdfsService hdfsService;
	private OozieService oozieService;
	private FlowService flowService;
	private FlowDeployService flowDeployService;

	private ModuleLoader getModuleLoader() {
		return moduleLoader;
	}

	@Autowired
	private void setModuleLoader(ModuleLoader moduleLoader) {
		this.moduleLoader = moduleLoader;
	}

	private NodeConfigurationService getNodeConfigurationService() {
		return nodeConfigurationService;
	}

	@Autowired
	private void setNodeConfigurationService(
			NodeConfigurationService nodeConfigurationService) {
		this.nodeConfigurationService = nodeConfigurationService;
	}

	private ClusterConfiguration getClusterConfiguration() {
		return clusterConfiguration;
	}

	@Autowired
	private void setClusterConfiguration(
			ClusterConfiguration clusterConfiguration) {
		this.clusterConfiguration = clusterConfiguration;
	}

	private HdfsService getHdfsService() {
		return hdfsService;
	}

	@Autowired
	private void setHdfsService(HdfsService hdfsService) {
		this.hdfsService = hdfsService;
	}

	private OozieService getOozieService() {
		return oozieService;
	}

	@Autowired
	private void setOozieService(OozieService oozieService) {
		this.oozieService = oozieService;
	}

	private FlowService getFlowService() {
		return flowService;
	}

	@Autowired
	private void setFlowService(FlowService flowService) {
		this.flowService = flowService;
	}

	private FlowDeployService getFlowDeployService() {
		return flowDeployService;
	}

	@Autowired
	private void setFlowDeployService(FlowDeployService flowDeployService) {
		this.flowDeployService = flowDeployService;
	}

	public RunFlowResultModel runFlow(UUID flowId) {
		RunFlowResultModel model = new RunFlowResultModel();
		model.setFlowId(flowId);
		model.setCommited(false);
		StringBuilder messageBuilder = new StringBuilder();

		Flow flow = (Flow) this.getFlowService().getFlow(flowId);

		if (flow == null) {
			messageBuilder.append("Flow " + flowId + " not found!");
			model.setMessage(messageBuilder.toString());
			return model;
		}

		try {
			Map<UUID, Class<?>> moduleClasses = this.getModuleLoader()
					.searchForModuleClasses();

			Set<Node> nodes = flow.getNodes();

			messageBuilder.append("Start parsing flow ..." + "\n");
			List<Node> startNodes = findStartNodes(nodes, moduleClasses);
			if (startNodes.size() != 1) {
				messageBuilder.append("Error: Wrong start node number "
						+ startNodes.size());
			} else {
				DirectedGraph graph = new DirectedGraph(flow.getNodes(),
						flow.getEdges(), startNodes.get(0));
				List<Integer> sorted = new TopologicalSort(graph).getOrder();

				if (sorted == null) {
					messageBuilder.append("Error: Flow is has Circles!");
				} else {
					String flowName = flow.getName();
					String workflowXml = genWorkflowXml(flowName, sorted,
							moduleClasses, graph);

					messageBuilder.append("Parsing flow ... Finised" + "\n");
					messageBuilder.append("Start deploying flow ..." + "\n");

					String localDeployPath = this.getClusterConfiguration()
							.getProperty(ClusterConfiguration.WORKSPACE_LOCAL)
							+ flowName;
					boolean deloyedLocally = this.getFlowDeployService()
							.deployFlowLocal(localDeployPath, workflowXml,
									getJarPaths(nodes, moduleClasses));
					if (deloyedLocally) {
						messageBuilder.append(flowName
								+ " has been deployed locally!" + "\n");

						String hdfsDeployPath = this.getClusterConfiguration()
								.getProperty(
										ClusterConfiguration.WORKSPACE_HDFS)
								+ flowName;
						boolean deleted = this.getHdfsService()
								.deleteDirectory(hdfsDeployPath);
						if (deleted) {
							messageBuilder.append("Old folder deleted: "
									+ hdfsDeployPath + "\n");
						}

						boolean deployedToHdfs = this.getHdfsService()
								.uploadFile(localDeployPath, hdfsDeployPath);
						if (deployedToHdfs) {
							messageBuilder.append(flowName
									+ " has been uploaded to hdfs!" + "\n");

							String jobId = this.getOozieService().runJob(
									flowName);
							if (jobId == null) {
								messageBuilder.append("Failed to commit job: "
										+ flowName + "\n");
							} else {
								messageBuilder.append("Job commited! Job id : "
										+ jobId + "\n");
								model.setCommited(true);
								model.setJobId(jobId);
							}
						} else {
							messageBuilder.append(flowName
									+ " failed to be uploaded to hdfs!" + "\n");
						}
					} else {
						messageBuilder.append(flowName
								+ " failed to be deployed locally!" + "\n");
					}
				}
			}

			System.out.println(messageBuilder.toString());
			model.setMessage(messageBuilder.toString());
			return model;
		} catch (Exception e) {
			e.printStackTrace();
			model.setMessage(messageBuilder.toString());
			return model;
		}
	}

	private Set<String> getJarPaths(Set<Node> nodes,
			Map<UUID, Class<?>> moduleClasses) {
		Set<String> jarPaths = new HashSet<String>();
		for (Node node : nodes) {
			Class<?> module = moduleClasses.get(node.getModuleId());
			String path = module.getProtectionDomain().getCodeSource()
					.getLocation().getFile();
			jarPaths.add(path);
		}
		return jarPaths;
	}

	private List<Node> findStartNodes(Set<Node> nodes,
			Map<UUID, Class<?>> moduleClasses) {
		List<Node> startNodes = new ArrayList<Node>();
		for (Node node : nodes) {
			Class<?> module = moduleClasses.get(node.getModuleId());
			if (module != null && module.equals(StartModule.class)) {
				startNodes.add(node);
			}
		}
		return startNodes;
	}

	private void replaceEndNode(List<Integer> sorted,
			Map<UUID, Class<?>> moduleClasses, DirectedGraph graph) {
		for (int i = 0; i < sorted.size(); i++) {// move end node to the end
			int w = sorted.get(i);
			Node node = graph.getNode(w);
			Class<?> moduleClass = moduleClasses.get(node.getModuleId());
			if (moduleClass.equals(EndModule.class)) {// what if we have more
														// than one end?
				for (int j = i + 1; j < sorted.size(); j++) {
					sorted.set(j - 1, sorted.get(j));
				}
				sorted.set(sorted.size() - 1, w);
				break;
			}
		}
	}

	private String genWorkflowXml(String flowName, List<Integer> sorted,
			Map<UUID, Class<?>> moduleClasses, DirectedGraph graph)
			throws InstantiationException, IllegalAccessException {
		StringBuilder workflowXml = new StringBuilder();
		workflowXml
				.append("<workflow-app xmlns=\"uri:oozie:workflow:0.2\" name=\""
						+ flowName + "\">" + "\n");

		this.replaceEndNode(sorted, moduleClasses, graph);

		for (int i = 0; i < sorted.size(); i++) {// generate xml
			if (i == sorted.size() - 1) {// inject kill node
				workflowXml
						.append("<kill name=\"fail\">"
								+ "<message>Work flow failed, "
								+ "error message[${wf:errorMessage(wf:lastErrorNode())}]</message>"
								+ "</kill>" + "\n");
			}
			int w = sorted.get(i);
			Node node = graph.getNode(w);
			Class<?> moduleClass = moduleClasses.get(node.getModuleId());
			ModuleMetadata module = (ModuleMetadata) moduleClass.newInstance();
			Map<String, String> configurations = new HashMap<String, String>();
			configurations.put("name", node.getName());
			List<NodeConfiguration> ncps = this.getNodeConfigurationService()
					.getNodeConfiguration(node.getId());
			for (NodeConfiguration ncp : ncps) {
				String key = ncp.getKey();
				String value = ncp.getValue();
				configurations.put(key, value);
			}

			List<Integer> adj = graph.getAdjacentNodeIndex(w);
			for (int v : adj) {
				if (sorted.contains(v)) {
					configurations.put("ok", graph.getNode(v).getName());
					break;// TODO
				}
			}
			String part = module.generate(configurations,
					graph.getInputs(node), graph.getOutputs(node));
			workflowXml.append(part + "\n");
		}
		workflowXml.append("</workflow-app>" + "\n");
		return workflowXml.toString();
	}

}
