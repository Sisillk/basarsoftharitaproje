using System.Net;

namespace backend_new.Services
{
    public class GeoServerService
    {
        private readonly HttpClient _httpClient;

        public GeoServerService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> GetLayerAsync(
            string layerName,
            int userId)
        {
            var filter =
                $"inserted_user_id={userId} AND is_deleted=false AND is_active=true";

            var url =
                "http://localhost:8080/geoserver/basarsoft/ows" +
                "?service=WFS" +
                "&version=2.0.0" +
                "&request=GetFeature" +
                $"&typeNames=basarsoft:{layerName}" +
                "&outputFormat=application/json" +
                $"&cql_filter={WebUtility.UrlEncode(filter)}";

            return await _httpClient.GetStringAsync(url);
        }
    }
}