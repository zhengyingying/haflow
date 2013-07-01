package haflow.module.zrace;

import haflow.module.AbstractJavaModule;
import haflow.module.DataType;
import haflow.module.Module;
import haflow.module.ModuleConfiguration;
import haflow.module.ModuleEndpoint;
import haflow.module.ModuleType;

import java.util.Map;

@Module(id = "ada600a8-aa63-968a-ca56-abbe13e0bd2f", name = "NaiveBayesTest", category = "zrace", type = ModuleType.JAVA, configurations = {
		@ModuleConfiguration(key = "i", displayName = "Input File Path", pattern = "^(.*)$", order = 1),
		@ModuleConfiguration(key = "o", displayName = "Output File Path", pattern = "^(.*)$", order = 2),
		@ModuleConfiguration(key = "l", displayName = "Label Index Path", pattern = "^(.*)$", order = 3),
		@ModuleConfiguration(key = "m", displayName = "Model Path", pattern = "^(.*)$", order = 4),
		@ModuleConfiguration(key = "others", displayName = "Other Parameters", pattern = "^(.*)$", order = 5), }, inputs = { @ModuleEndpoint(name = "from", minNumber = 1, maxNumber = 1, dataType = DataType.PlainText, order = 1) }, outputs = {
		@ModuleEndpoint(name = "ok", minNumber = 1, maxNumber = 1, dataType = DataType.PlainText, order = 1),
		@ModuleEndpoint(name = "error", minNumber = 1, maxNumber = 1, dataType = DataType.PlainText, order = 2) })
public class NaiveBayesTestModule extends AbstractJavaModule {

	@Override
	public boolean validate(Map<String, String> configurations,
			Map<String, String> inputs, Map<String, String> outputs) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String getMainClass() {
		return NaiveBayesTestModule.class.getName();
	}

	@Override
	public String getArguments(Map<String, String> configurations) {
		StringBuilder sb = new StringBuilder();
		for (String key : configurations.keySet()) {
			if (key.equals("others")) {
				sb.append(configurations.get(key) + " ");
			} else {
				sb.append("-" + key + " \"" + configurations.get(key) + "\" ");
			}
		}
		return sb.toString();
	}

	public static void main(String[] args) {
		System.out.println("Demo Java Main");

		System.out.println("# Arguments: " + args.length);
		for (int i = 0; i < args.length; i++) {
			System.out.println("Argument[" + i + "]: " + args[i]);
		}
	}

}