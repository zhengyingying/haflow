package haflow.module.basic;

import haflow.module.AbstractModule;
import haflow.module.DataType;
import haflow.module.Module;
import haflow.module.ModuleConfiguration;
import haflow.module.ModuleConfigurationType;
import haflow.module.ModuleEndpoint;
import haflow.module.ModuleType;

import java.util.Map;

@Module(id = "b0d027c3-a4bd-61b5-5063-134ff71f8123", name = "Kill", category = "Basic", type = ModuleType.KILL, configurations = {
		@ModuleConfiguration(key = "name", displayName = "Name", pattern = "^(.*)$", type = ModuleConfigurationType.PLAIN_TEXT),
		@ModuleConfiguration(key = "message", displayName = "Message", pattern = "^(.*)$", type = ModuleConfigurationType.PLAIN_TEXT) }, inputs = { @ModuleEndpoint(name = "from", minNumber = 1, maxNumber = 1, dataType = DataType.PlainText) }, outputs = {})
public final class KillModule extends AbstractModule {

	@Override
	public boolean validate(Map<String, String> configurations,
			Map<String, String> inputs, Map<String, String> outputs) {
		// TODO Auto-generated method stub
		return false;
	}

}
