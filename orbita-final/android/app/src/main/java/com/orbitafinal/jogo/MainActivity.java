package com.orbitafinal.jogo;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // avisa o jogo quando o app vai para segundo plano / volta, para pausar e retomar a música
    @Override
    public void onPause() {
        if (getBridge() != null) getBridge().triggerDocumentJSEvent("pause");
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null) getBridge().triggerDocumentJSEvent("resume");
    }
}
