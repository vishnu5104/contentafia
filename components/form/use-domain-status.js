import useSWR from "swr";
import { fetcher } from "@/lib/utils";
export function useDomainStatus({ domain }) {
    const { data, isValidating } = useSWR(`/api/domain/${domain}/verify`, fetcher, {
        revalidateOnMount: true,
        refreshInterval: 5000,
        keepPreviousData: true,
    });
    return {
        status: data?.status,
        domainJson: data?.domainJson,
        loading: isValidating,
    };
}
