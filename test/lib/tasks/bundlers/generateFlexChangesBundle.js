import test from "ava";
import sinon from "sinon";
import generateFlexChangesBundle from "../../../../lib/tasks/bundlers/generateFlexChangesBundle.js";


function createPlaceholderResource(content) {
	return {
		name: "file",
		getBuffer: async () => JSON.stringify(content),
		getString: () => JSON.stringify(content),
		setString: (string) => undefined
	};
}

function createPlaceholderWorkspace(changes, manifest, flexBundle) {
	return {
		byGlob: async (path) => changes.map(createPlaceholderResource),
		byPath: async (path) => {
			if ( path.includes("manifest.json") ) {
				return createPlaceholderResource(manifest);
			} else if ( path.includes("flexibility-bundle.json")) {
				return createPlaceholderResource(flexBundle);
			}
		},
		write: () => {
			throw new Error("Function 'write' is not implemented");
		}
	};
}

["1.120.0", ["1.120.0", "2.0.0"]].forEach((minVersion) => {
	test.serial(`execute flexChangeBundler with app descriptor change tagged with
		omitFromBuildResult and minVersion: ${minVersion}`, async (t) => {
		const changeList = [
			{
				"fileName": "id_1753705252082_addAnnotationsToOData",
				"namespace": "apps/MyComponent/changes",
				"layer": "CUSTOMER_BASE",
				"fileType": "change",
				"creation": "2025-07-28T12:20:52.082Z",
				"packageName": "$TMP",
				"reference": "rta.performance.Component",
				"support": {
					"generator": "@sap-ux/adp-tooling"
				},
				"changeType": "appdescr_app_addAnnotationsToOData",
				"content": {
					"dataSourceId": "mainService",
					"annotations": [
						"customer.annotation.annotation_1753705252082"
					],
					"annotationsInsertPosition": "END",
					"dataSource": {
						"customer.annotation.annotation_1753705252082": {
							"uri": "annotations/annotation_1753705252082.xml",
							"type": "ODataAnnotation"
						}
					}
				}
			},
			{
				"fileName": "id_1504764957625_7_rename1",
				"fileType": "change",
				"changeType": "rename",
				"reference": "rta.performance.Component",
				"packageName": "$TMP",
				"content": {
					"originalControlType": "sap.m.Label"
				},
				"selector": {
					"id": "initialLabel",
					"idIsLocal": false
				},
				"layer": "CUSTOMER",
				"texts": {
					"newText": {
						"value": "rename_0",
						"type": "XFLD"
					}
				},
				"namespace": "apps/MyComponent/changes/",
				"creation": "2017-10-06T11:54:55.238Z",
				"originalLanguage": "EN",
				"conditions": {},
				"context": "",
				"support": {
					"generator": "Change.createInitialFileContent",
					"service": "",
					"user": "",
					"sapui5Version": "1.51.0-SNAPSHOT"
				},
				"dependentSelector": {},
				"validAppVersions": {
					"creation": "1.0.0",
					"from": "1.0.0",
					"to": "1.0.0"
				}
			}
		];

		const manifest = {
			"sap.ui5": {
				dependencies: {
					minUI5Version: minVersion
				}
			}
		};

		const taskUtil = {
			getTag: sinon.stub().callsFake((...args) => {
				return JSON.parse(args[0].getString()).changeType.startsWith("appdescr_");
			}),
			setTag: sinon.stub(),
			STANDARD_TAGS: {
				HasDebugVariant: "1️⃣",
				IsDebugVariant: "2️⃣",
				OmitFromBuildResult: "3️⃣"
			},
			resourceFactory: {
				createFilterReader: sinon.stub().callsFake(
					({reader, callback}) => {
						return {
							byGlob: async (pattern) => {
								const resources = await reader.byGlob(pattern);
								return resources.filter(callback);
							}
						};
					}
				)
			},
			registerCleanupTask: sinon.stub()
		};

		const placeholderWorkspace = createPlaceholderWorkspace(changeList, manifest, {});
		const stub = sinon.stub(placeholderWorkspace, "write").returnsArg(0);
		await generateFlexChangesBundle({
			workspace: placeholderWorkspace,
			taskUtil: taskUtil,
			options: {
				projectNamespace: "mypath"
			}
		});

		const existingChangeList = [{
			fileName: "id_1504764957625_7_rename1",
			fileType: "change",
			changeType: "rename",
			reference: "rta.performance.Component",
			packageName: "$TMP",
			content: {
				originalControlType: "sap.m.Label"
			},
			selector: {
				id: "initialLabel",
				idIsLocal: false,
			},
			layer: "CUSTOMER",
			texts: {
				newText: {
					value: "rename_0",
					type: "XFLD"
				}
			},
			namespace: "apps/MyComponent/changes/",
			creation: "2017-10-06T11:54:55.238Z",
			originalLanguage: "EN",
			conditions: {},
			context: "",
			support: {
				generator: "Change.createInitialFileContent",
				service: "",
				user: "",
				sapui5Version: "1.51.0-SNAPSHOT",
			},
			dependentSelector: {
			},
			validAppVersions: {
				creation: "1.0.0",
				from: "1.0.0",
				to: "1.0.0",
			}
		}];

		const flexBundle = {
			"changes": existingChangeList,
			"compVariants": [],
			"variantChanges": [],
			"variantDependentControlChanges": [],
			"variantManagementChanges": [],
			"variants": []
		};

		const content = JSON.parse(await stub.getCall(0).args[0].getString());
		t.deepEqual(content, flexBundle, "Result must contain the same content");

		const path = await stub.getCall(0).args[0].getPath();
		t.is(path, "/resources/mypath/changes/flexibility-bundle.json");
	});

	test.serial(`execute flexChangeBundler with the minVersion: ${minVersion}`, async (t) => {
		const changeList = [
			{
				"fileName": "id_1504764957625_7_rename1",
				"fileType": "change",
				"changeType": "rename",
				"reference": "rta.performance.Component",
				"packageName": "$TMP",
				"content": {
					"originalControlType": "sap.m.Label"
				},
				"selector": {
					"id": "initialLabel",
					"idIsLocal": false
				},
				"layer": "CUSTOMER",
				"texts": {
					"newText": {
						"value": "rename_0",
						"type": "XFLD"
					}
				},
				"namespace": "apps/MyComponent/changes/",
				"creation": "2017-10-06T11:54:55.238Z",
				"originalLanguage": "EN",
				"conditions": {},
				"context": "",
				"support": {
					"generator": "Change.createInitialFileContent",
					"service": "",
					"user": "",
					"sapui5Version": "1.51.0-SNAPSHOT"
				},
				"dependentSelector": {},
				"validAppVersions": {
					"creation": "1.0.0",
					"from": "1.0.0",
					"to": "1.0.0"
				}
			}
		];
		const existingChangeList = [
			{
				"fileName": "id_1504764957630_7_rename2",
				"fileType": "change",
				"changeType": "rename",
				"reference": "rta.performance.Component",
				"packageName": "$TMP",
				"content": {
					"originalControlType": "sap.m.Label"
				},
				"selector": {
					"id": "initialLabel",
					"idIsLocal": false
				},
				"layer": "USER",
				"texts": {
					"newText": {
						"value": "rename_5",
						"type": "XFLD"
					}
				},
				"namespace": "apps/MyComponent/changes/",
				"creation": "2017-09-01T11:54:55.238Z",
				"originalLanguage": "EN",
				"conditions": {},
				"context": "",
				"support": {
					"generator": "Change.createInitialFileContent",
					"service": "",
					"user": "",
					"sapui5Version": "1.51.0-SNAPSHOT"
				},
				"dependentSelector": {},
				"validAppVersions": {
					"creation": "1.0.0",
					"from": "1.0.0",
					"to": "1.0.0"
				}
			}
		];
		const manifest = {
			"sap.ui5": {
				dependencies: {
					minUI5Version: minVersion
				}
			}
		};

		const flexBundle = {
			"changes": existingChangeList,
			"compVariants": [],
			"variantChanges": [],
			"variantDependentControlChanges": [],
			"variantManagementChanges": [],
			"variants": []
		};

		const flexBundleMerge = {
			"changes": existingChangeList.concat(changeList),
			"compVariants": [],
			"variantChanges": [],
			"variantDependentControlChanges": [],
			"variantManagementChanges": [],
			"variants": []
		};

		const placeholderWorkspace = createPlaceholderWorkspace(changeList, manifest, flexBundle);
		const stub = sinon.stub(placeholderWorkspace, "write").returnsArg(0);
		await generateFlexChangesBundle({
			workspace: placeholderWorkspace,
			taskUtil: false,
			options: {
				projectNamespace: "mypath"
			}
		});

		const content = JSON.parse(await stub.getCall(0).args[0].getString());
		t.deepEqual(content, flexBundleMerge, "Result must contain the same content");

		const path = await stub.getCall(0).args[0].getPath();
		t.is(path, "/resources/mypath/changes/flexibility-bundle.json");
	});
});

["1.70.0", ["1.70.0", "2.0.0"]].forEach((minVersion) => {
	test.serial(`execute flexChangeBundler with the minVersion < 1.73: ${minVersion}`, async (t) => {
		const manifest = {
			"sap.ui5": {
				dependencies: {
					minUI5Version: minVersion
				}
			}
		};

		const changeList = [
			{
				"fileName": "id_1504764957625_7_rename1",
				"fileType": "change",
				"changeType": "rename",
				"reference": "rta.performance.Component",
				"packageName": "$TMP",
				"content": {
					"originalControlType": "sap.m.Label"
				},
				"selector": {
					"id": "initialLabel",
					"idIsLocal": false
				},
				"layer": "CUSTOMER",
				"texts": {
					"newText": {
						"value": "rename_0",
						"type": "XFLD"
					}
				},
				"namespace": "apps/MyComponent/changes/",
				"creation": "2017-10-06T11:54:55.238Z",
				"originalLanguage": "EN",
				"conditions": {},
				"context": "",
				"support": {
					"generator": "Change.createInitialFileContent",
					"service": "",
					"user": "",
					"sapui5Version": "1.51.0-SNAPSHOT"
				},
				"dependentSelector": {},
				"validAppVersions": {
					"creation": "1.0.0",
					"from": "1.0.0",
					"to": "1.0.0"
				}
			}
		];

		const flexBundle = {
			"changes": [],
			"compVariants": [],
			"variantChanges": [],
			"variantDependentControlChanges": [],
			"variantManagementChanges": [],
			"variants": []
		};

		const placeholderWorkspace = createPlaceholderWorkspace(changeList, manifest, flexBundle);
		const stub = sinon.stub(placeholderWorkspace, "write").returnsArg(0);

		await generateFlexChangesBundle({
			workspace: placeholderWorkspace,
			taskUtil: false,
			options: {
				projectNamespace: "mypath"
			}
		});

		const content = JSON.parse(await stub.getCall(0).args[0].getString());
		t.deepEqual(content, changeList, "Result must contain the same content");

		const path = await stub.getCall(0).args[0].getPath();
		t.is(path, "/resources/mypath/changes/changes-bundle.json");
	});
});
