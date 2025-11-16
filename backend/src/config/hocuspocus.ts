import {
  Hocuspocus,
  onAuthenticatePayload,
  onAwarenessUpdatePayload,
  onChangePayload,
  onConfigurePayload,
  onConnectPayload,
  onCreateDocumentPayload,
  onDestroyPayload,
  onDisconnectPayload,
  onRequestPayload,
  onListenPayload,
  onLoadDocumentPayload,
  onStatelessPayload,
  onStoreDocumentPayload,
  onTokenSyncPayload,
  onUpgradePayload,
  beforeBroadcastStatelessPayload,
  beforeHandleMessagePayload,
  beforeSyncPayload,
  beforeUnloadDocumentPayload,
  afterLoadDocumentPayload,
  afterStoreDocumentPayload,
  afterUnloadDocumentPayload,
} from "@hocuspocus/server";

import logger from "./logger.ts";

const hocuspocusServer = new Hocuspocus({
  name: "hocus-pocus-instance",

  onConfigure: async (data: onConfigurePayload) => {
    logger.debug("HocusPocus onConfigure", data);
  },

  onConnect: async (data: onConnectPayload) => {
    logger.debug("HocusPocus onConnect", {
      context: data.context,
      documentName: data.documentName,
      requestParameters: data.requestParameters,
      socketId: data.socketId,
    });
  },

  onDisconnect: async (data: onDisconnectPayload) => {
    logger.debug("HocusPocus onDisconnect", {
      clientsCount: data.clientsCount,
      context: data.context,
      document: data.document,
      documentName: data.documentName,
      socketId: data.socketId,
    });
  },

  // onRequest: async (data: onRequestPayload) => {
  //     logger.debug("HocusPocus onRequest");
  // },

  // onAuthenticate: async (data: onAuthenticatePayload) => {
  //     logger.debug("HocusPocus onAuthenticate");
  // },

  // onAwarenessUpdate: async (data: onAwarenessUpdatePayload) => {
  //     logger.debug("HocusPocus onAwarenessUpdate");
  // },

  // onChange: async (data: onChangePayload) => {
  //     logger.debug("HocusPocus onChange");
  // },

  // onCreateDocument: async (data: onCreateDocumentPayload) => {
  //     logger.debug("HocusPocus onCreateDocument");
  // },

  // onDestroy: async (data: onDestroyPayload) => {
  //     logger.debug("HocusPocus onDestroy");
  // },

  // onListen: async (data: onListenPayload) => {
  //     logger.debug("HocusPocus onListen");
  // },

  // onLoadDocument: async (data: onLoadDocumentPayload) => {
  //     logger.debug("HocusPocus onLoadDocument");
  // },

  // onStateless: async (data: onStatelessPayload) => {
  //     logger.debug("HocusPocus onStateless");
  // },

  // onStoreDocument: async (data: onStoreDocumentPayload) => {
  //     logger.debug("HocusPocus onStoreDocument");
  // },

  // onTokenSync: async (data: onTokenSyncPayload) => {
  //     logger.debug("HocusPocus onTokenSync");
  // },

  // onUpgrade: async (data: onUpgradePayload) => {
  //     logger.debug("HocusPocus onUpgrade");
  // },

  // beforeBroadcastStateless: async (data: beforeBroadcastStatelessPayload) => {
  //     logger.debug("HocusPocus beforeBroadcastStateless");
  // },

  // beforeHandleMessage: async (data: beforeHandleMessagePayload) => {
  //     logger.debug("HocusPocus beforeHandleMessage");
  // },

  // beforeSync: async (data: beforeSyncPayload) => {
  //     logger.debug("HocusPocus beforeSync");
  // },

  // beforeUnloadDocument: async (data: beforeUnloadDocumentPayload) => {
  //     logger.debug("HocusPocus beforeUnloadDocument");
  // },

  // afterLoadDocument: async (data: afterLoadDocumentPayload) => {
  //     logger.debug("HocusPocus afterLoadDocument");
  // },

  // afterStoreDocument: async (data: afterStoreDocumentPayload) => {
  //     logger.debug("HocusPocus afterStoreDocument");
  // },

  // afterUnloadDocument: async (data: afterUnloadDocumentPayload) => {
  //     logger.debug("HocusPocus afterUnloadDocument");
  // },
});

export const shutdownHocuspocus = async () => {
  try {
    // Close all connections
    hocuspocusServer.closeConnections();

    // Unload all loaded documents
    for (const [name, doc] of hocuspocusServer.documents) {
      await hocuspocusServer.unloadDocument(doc);
    }

    // Clear the documents map
    hocuspocusServer.documents.clear();
    hocuspocusServer.loadingDocuments.clear();
    hocuspocusServer.unloadingDocuments.clear();

    logger.info("HocusPocus server cleaned up");
  } catch (err) {
    logger.error("Error shutting down HocusPocus server", err);
  }
};

export default hocuspocusServer;
