package haflow.engine.oozie;

import haflow.dto.entity.Node;

import java.util.Map;

import org.w3c.dom.Document;

public class StartModuleGenerator extends OozieXmlGenerator {

	@Override
	public Document generate(Map<String, String> configurations,
			Map<String, Node> inputs, Map<String, Node> outputs) {
		// TODO Auto-generated method stub
		String xml = "<start to=\"" + outputs.get("ok").getName() + "\"/>";
		return null;
	}

}
