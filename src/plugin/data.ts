import { type PluginDataInterface } from './plugin.ts';
import {type DownloadDataPoint, type DownloadReleaseCorrelationDataPoint, type PerMonthDataPoint} from "../types.ts";

export function dateToString(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}



export function getDownloadDataPoints(plugins: PluginDataInterface[]): DownloadDataPoint[] {
    const data: DownloadDataPoint[] = [];

    for (const plugin of plugins) {
        const downloadHistoryData = Object.entries(plugin.downloadHistory);
        if (downloadHistoryData.length === 0) continue;

        const startDate = new Date(downloadHistoryData[0][0]);
        const endDate = new Date(downloadHistoryData[downloadHistoryData.length - 1][0]);

        // advance the end date by one day, otherwise the last week will be missing sometimes
        endDate.setDate(endDate.getDate() + 1);

        startDate.setDate(startDate.getDate() + (7 - startDate.getDay()));

        let lastDownloadCount: number | undefined = 0;

        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 7)) {
            const date = dateToString(d);

            const downloadCount = downloadHistoryData.find(d => d[0] === date)?.[1];
            let growth: number | undefined = undefined;
            if (downloadCount !== undefined && lastDownloadCount !== undefined) {
                growth = downloadCount - lastDownloadCount;
            }
            lastDownloadCount = downloadCount;

            const existingData = data.find(x => x.date === date);

            if (existingData !== undefined) {
                if (existingData.downloads === undefined) {
                    existingData.downloads = downloadCount;
                } else {
                    if (downloadCount !== undefined) {
                        existingData.downloads += downloadCount;
                    }
                }

                if (existingData.growth === undefined) {
                    existingData.growth = growth;
                } else {
                    if (growth !== undefined) {
                        existingData.growth += growth;
                    }
                }
            } else {
                data.push({
                    date: date,
                    downloads: downloadCount,
                    growth: growth,
                });
            }
        }
    }

    return data.sort((a, b) => a.date.localeCompare(b.date));
}


export function getDownloadReleaseCorrelationDataPoints(plugins: PluginDataInterface[]): DownloadReleaseCorrelationDataPoint[] {
    const data: DownloadReleaseCorrelationDataPoint[] = [];

    for (const plugin of plugins) {
        const downloadKeys = Object.keys(plugin.downloadHistory);

        const downloads = plugin.downloadHistory[downloadKeys[downloadKeys.length - 1]];
        const initialReleaseDate = new Date(plugin.addedCommit.date).valueOf();
        const initialReleaseDateString = dateToString(new Date(plugin.addedCommit.date));
        const releases = plugin.versionHistory.length;

        data.push({
            id: plugin.id,
            downloads: downloads,
            releases: releases,
            initialReleaseDate: initialReleaseDate,
            initialReleaseDateString: initialReleaseDateString,
        });
    }

    return data;
}

export function getRetiredPlugins(plugins: PluginDataInterface[]): PluginDataInterface[] {
    return plugins.filter(plugin => plugin.removedCommit !== undefined).sort((a, b) => a.id.localeCompare(b.id));
}

export function getRecentRetiredPlugins(plugins: PluginDataInterface[]): PluginDataInterface[] {
    return plugins
        .filter(plugin => plugin.removedCommit !== undefined)
        .sort((a, b) => new Date(b.removedCommit!.date).valueOf() - new Date(a.removedCommit!.date).valueOf())
        .slice(0, 15);
}


export function getPercentageOfRetiredPluginsByReleaseMonth(plugins: PluginDataInterface[]): PerMonthDataPoint[] {
    const data: PerMonthDataPoint[] = [];

    const firstReleaseDate = new Date(plugins[0].addedCommit.date);
    const lastReleaseDate = new Date(plugins[plugins.length - 1].addedCommit.date);

    for (let d = firstReleaseDate; d <= lastReleaseDate; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');

        const releasedPlugins = plugins.filter(plugin => {
            const releaseDate = new Date(plugin.addedCommit.date);
            return releaseDate.getFullYear() === d.getFullYear() && releaseDate.getMonth() === d.getMonth();
        });

        const retiredPlugins = releasedPlugins.filter(plugin => plugin.removedCommit !== undefined);

        const percentage = (retiredPlugins.length / releasedPlugins.length) * 100;

        data.push({
            year: year,
            month: month,
            value: percentage,
        });
    }

    return data;
}

export function getNewPluginReleasesPerMonth(plugins: PluginDataInterface[]): PerMonthDataPoint[] {
    const data: PerMonthDataPoint[] = [];

    const firstReleaseDate = new Date(plugins[0].addedCommit.date);
    const lastReleaseDate = new Date(plugins[plugins.length - 1].addedCommit.date);

    for (let d = firstReleaseDate; d <= lastReleaseDate; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');

        const releasedPlugins = plugins.filter(plugin => {
            const releaseDate = new Date(plugin.addedCommit.date);
            return releaseDate.getFullYear() === d.getFullYear() && releaseDate.getMonth() === d.getMonth();
        });

        data.push({
            year: year,
            month: month,
            value: releasedPlugins.length,
        });
    }

    return data;
}

export function getPluginCountPerMonth(plugins: PluginDataInterface[]): PerMonthDataPoint[] {
    const data: PerMonthDataPoint[] = [];

    const firstReleaseDate = new Date(plugins[0].addedCommit.date);
    const lastReleaseDate = new Date(plugins[plugins.length - 1].addedCommit.date);

    let totalPlugins = 0;

    for (let d = firstReleaseDate; d <= lastReleaseDate; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');

        const releasedPlugins = plugins.filter(plugin => {
            const releaseDate = new Date(plugin.addedCommit.date);
            return releaseDate.getFullYear() === d.getFullYear() && releaseDate.getMonth() === d.getMonth();
        });

        totalPlugins += releasedPlugins.length;

        data.push({
            year: year,
            month: month,
            value: totalPlugins,
        });
    }

    return data;
}

export function getPluginCountPerMonthWoRetiredPlugins(plugins: PluginDataInterface[]): PerMonthDataPoint[] {
    const data: PerMonthDataPoint[] = [];

    const firstReleaseDate = new Date(plugins[0].addedCommit.date);
    const lastReleaseDate = new Date(plugins[plugins.length - 1].addedCommit.date);

    let totalPlugins = 0;

    for (let d = firstReleaseDate; d <= lastReleaseDate; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');

        const releasedPlugins = plugins.filter(plugin => {
            const releaseDate = new Date(plugin.addedCommit.date);
            return releaseDate.getFullYear() === d.getFullYear() && releaseDate.getMonth() === d.getMonth();
        });

        const retiredPlugins = plugins
            .filter(plugin => plugin.removedCommit !== undefined)
            .filter(plugin => {
                const removedDate = new Date(plugin.removedCommit!.date);
                return removedDate.getFullYear() === d.getFullYear() && removedDate.getMonth() === d.getMonth();
            });

        totalPlugins += releasedPlugins.length - retiredPlugins.length;

        data.push({
            year: year,
            month: month,
            value: totalPlugins,
        });
    }

    return data;
}

export function getRetiredPluginCountPerMonth(plugins: PluginDataInterface[]): PerMonthDataPoint[] {
    const data: PerMonthDataPoint[] = [];

    const firstReleaseDate = new Date(plugins[0].addedCommit.date);
    const lastReleaseDate = new Date(plugins[plugins.length - 1].addedCommit.date);

    let totalRetiredPlugins = 0;

    for (let d = firstReleaseDate; d <= lastReleaseDate; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');

        const retiredPlugins = plugins
            .filter(plugin => plugin.removedCommit !== undefined)
            .filter(plugin => {
                const removedDate = new Date(plugin.removedCommit!.date);
                return removedDate.getFullYear() === d.getFullYear() && removedDate.getMonth() === d.getMonth();
            });

        totalRetiredPlugins += retiredPlugins.length;

        data.push({
            year: year,
            month: month,
            value: totalRetiredPlugins,
        });
    }

    return data;
}

export function getRetiredPluginsPerMonth(plugins: PluginDataInterface[]): PerMonthDataPoint[] {
    const data: PerMonthDataPoint[] = [];

    const firstReleaseDate = new Date(plugins[0].addedCommit.date);
    const lastReleaseDate = new Date(plugins[plugins.length - 1].addedCommit.date);

    for (let d = firstReleaseDate; d <= lastReleaseDate; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear().toString();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');

        const retiredPlugins = plugins
            .filter(plugin => plugin.removedCommit !== undefined)
            .filter(plugin => {
                const removedDate = new Date(plugin.removedCommit!.date);
                return removedDate.getFullYear() === d.getFullYear() && removedDate.getMonth() === d.getMonth();
            });

        data.push({
            year: year,
            month: month,
            value: retiredPlugins.length,
        });
    }

    return data;
}
