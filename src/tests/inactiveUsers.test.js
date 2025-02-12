const { inactiveUsers } = require("../../lib/inactiveUsers");
const { Octokit } = require('@octokit/rest');
const fetchMock = require('jest-fetch-mock');

describe("inactiveUsers plugin", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("inactiveUsers getOrgMemberData fetches all required data", async () => {
    const mockMembers = [
      { login: "member1", id: 1, type: "User" }
    ];
    const mockIssues = [
      { number: 1, title: "inactive-user-1" }
    ];
    const mockCollaborators = [
      { login: "collab1", id: 2, type: "User" }
    ];

    // Mock the three API endpoints with proper content-type headers
    fetchMock.mockResponses(
      // List members response
      [JSON.stringify(mockMembers), { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      }],
      // List issues response
      [JSON.stringify(mockIssues), { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      }],
      // List outside collaborators response
      [JSON.stringify(mockCollaborators), { 
        status: 200,
        headers: { 'content-type': 'application/json' }
      }]
    );

    const MyOctokit = Octokit.plugin(inactiveUsers);
    const octokit = new MyOctokit({
      auth: 'secret123',
      request: {
        fetch: fetchMock
      }
    });

    const result = await octokit.inactiveUsers.getOrgMemberData("avacado-corp", "octocat");

    // Verify results contain all three sets of data
    expect(result.members).toEqual(mockMembers);
    expect(result.userIssues).toEqual(mockIssues);
    expect(result.outsideCollaborators).toEqual(mockCollaborators);

    // Verify the API calls were made correctly
    const calls = fetchMock.mock.calls;
    expect(calls).toHaveLength(3);

    // Verify members API call and response headers
    expect(calls[0][0]).toMatch(/orgs\/avacado-corp\/members\?role=member/);
    
    // Verify issues API call includes correct label filter and response headers
    const issuesUrl = calls[1][0];
    expect(issuesUrl).toMatch(/repos\/avacado-corp\/octocat\/issues/);
    expect(issuesUrl).toMatch(/labels=inactive-user/);
    
    // Verify outside collaborators API call and response headers
    expect(calls[2][0]).toMatch(/orgs\/avacado-corp\/outside_collaborators/);
  });
});