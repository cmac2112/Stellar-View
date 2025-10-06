// Function to format time based on layer type
import type {GIBSLayerConfig} from "./ViewPage.tsx";

export const getFormattedTime = (date: Date, layerConfig: GIBSLayerConfig) => {
    if (layerConfig.temporal === "10min") {
        const minutes = Math.floor(date.getUTCMinutes() / 10) * 10;
        const rounded = new Date(date);
        rounded.setUTCMinutes(minutes, 0, 0);
        return rounded.toISOString().split(".")[0] + "Z";
    } else {
        return date.toISOString().split('T')[0];
    }
};

