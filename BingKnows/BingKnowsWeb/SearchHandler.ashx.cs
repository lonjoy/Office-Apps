/**************************************************
* Copyright (c) Microsoft Open Technologies (Shanghai) Company Limited.  All rights reserved.
* 
* The MIT License (MIT)
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
**************************************************/

namespace Microsoft.OpenTech
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using System.Web;
    using System.Web.Configuration;

    /// <summary>
    /// The class is bridge between Bing Knows search API and the Office app.
    /// </summary>
    public class SearchHandler : IHttpHandler
    {
        private const string EmptyJsonString = "{}";

        private static readonly TaskFactory defaultTaskFactory = new TaskFactory(CancellationToken.None, TaskCreationOptions.None, TaskContinuationOptions.None, TaskScheduler.Default);

        public bool IsReusable
        {
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            var search = context.Request.QueryString["q"];

            var result = default(string);

            if (string.IsNullOrWhiteSpace(search))
            {
                result = EmptyJsonString; // empty result in JSON format
            }
            else
            {
                result = defaultTaskFactory.StartNew(async () => await SearchBingKnows(search)).Unwrap().GetAwaiter().GetResult();

                if (!IsJsonFormat(result))
                {
                    result = EmptyJsonString;
                }
            }

            var response = context.Response;
            response.Clear();
            response.ContentType = "application/json";
            response.ContentEncoding = Encoding.UTF8;
            response.StatusCode = 200;
            response.Write(result);
            response.Flush();
        }

        private static async Task<string> SearchBingKnows(string search)
        {
            var uri = WebConfigurationManager.AppSettings["BingKnowsWikiApiAddress"];
            var param = HttpUtility.UrlEncode(search);
            uri = uri + param;

            using (var client = new HttpClient())
            {
                using (var response = await client.GetAsync(uri))
                {
                    response.EnsureSuccessStatusCode();
                    return await response.Content.ReadAsStringAsync();
                }
            }
        }

        private static bool IsJsonFormat(string content)
        {
            return !string.IsNullOrEmpty(content) && content.StartsWith("{", StringComparison.OrdinalIgnoreCase) && content.EndsWith("}", StringComparison.OrdinalIgnoreCase);
        }
    }
}