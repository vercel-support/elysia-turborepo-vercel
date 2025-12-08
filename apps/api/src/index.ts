import { Elysia, t } from "elysia";
import {
  type User,
  type Post,
  type ApiResponse,
  type PaginatedResponse,
  type UserId,
  type PostId,
  createSuccessResponse,
  createErrorResponse,
  createMockUser,
  createMockPost,
  isUserId,
  API_VERSION,
  DEFAULT_PAGE_SIZE,
} from "@elysia-on-vercel/shared";

// In-memory store for demonstration
const users = new Map<UserId, User>();
const posts = new Map<PostId, Post>();

// Initialize with mock data
const mockUser = createMockUser();
const mockPost = createMockPost({ authorId: mockUser.id });
users.set(mockUser.id, mockUser);
posts.set(mockPost.id, mockPost);

const app = new Elysia()
  .get("/", () => {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elysia Monorepo - Vercel Issue Reproduction</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 2rem;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .badge {
            display: inline-block;
            background: rgba(102, 126, 234, 0.2);
            border: 1px solid rgba(102, 126, 234, 0.5);
            color: #667eea;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.875rem;
            margin-bottom: 2rem;
          }
          .issue-box {
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          .issue-box h2 {
            color: #ff6b6b;
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
          }
          .issue-box p {
            color: #ccc;
            line-height: 1.6;
          }
          .code-block {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            font-family: "Fira Code", "Monaco", monospace;
            font-size: 0.875rem;
            overflow-x: auto;
          }
          .code-block .comment { color: #8b949e; }
          .code-block .keyword { color: #ff7b72; }
          .code-block .string { color: #a5d6ff; }
          .endpoints {
            display: grid;
            gap: 1rem;
            margin-top: 2rem;
          }
          .endpoint {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
          }
          .endpoint h3 {
            font-size: 1rem;
            margin-bottom: 0.5rem;
          }
          .method {
            display: inline-block;
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.5rem;
          }
          .method-get { background: #238636; color: white; }
          .method-post { background: #1f6feb; color: white; }
          .endpoint code {
            font-family: "Fira Code", monospace;
            color: #58a6ff;
          }
          .endpoint p {
            color: #8b949e;
            font-size: 0.875rem;
            margin-top: 0.5rem;
          }
          a { color: #58a6ff; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">API ${API_VERSION}</span>
          

          <h2>Test Endpoints</h2>
          <div class="endpoints">
            <div class="endpoint">
              <h3><span class="method method-get">GET</span><code>/api/users</code></h3>
              <p>Lists all users (uses PaginatedResponse&lt;User&gt; from shared package)</p>
            </div>
            <div class="endpoint">
              <h3><span class="method method-get">GET</span><code>/api/users/:id</code></h3>
              <p>Get user by ID (uses ApiResponse&lt;User&gt; from shared package)</p>
            </div>
            <div class="endpoint">
              <h3><span class="method method-post">POST</span><code>/api/users</code></h3>
              <p>Create a new user (validates against User interface from shared package)</p>
            </div>
            <div class="endpoint">
              <h3><span class="method method-get">GET</span><code>/api/posts</code></h3>
              <p>Lists all posts (uses PaginatedResponse&lt;Post&gt; from shared package)</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  })

  // GET /api/users - List all users with pagination
  // This endpoint uses PaginatedResponse<User> from the shared package
  // When composite is stripped, User resolves as 'unknown'
  .get("/api/users", ({ query }): PaginatedResponse<User> => {
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(
      parseInt(query.pageSize || String(DEFAULT_PAGE_SIZE)),
      100
    );
    
    const allUsers = Array.from(users.values());
    const start = (page - 1) * pageSize;
    const items = allUsers.slice(start, start + pageSize);
    
    return {
      items,
      total: allUsers.length,
      page,
      pageSize,
      hasMore: start + pageSize < allUsers.length,
    };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    })
  })

  // GET /api/users/:id - Get user by ID
  // This endpoint uses ApiResponse<User> from the shared package
  .get("/api/users/:id", ({ params }): ApiResponse<User | null> => {
    const userId = params.id as UserId;
    
    if (!isUserId(userId)) {
      return createErrorResponse("Invalid user ID");
    }
    
    const user = users.get(userId);
    
    if (!user) {
      return createErrorResponse("User not found");
    }
    
    return createSuccessResponse(user);
  }, {
    params: t.Object({
      id: t.String(),
    })
  })

  // POST /api/users - Create a new user
  // This endpoint validates against the User interface from shared package
  .post("/api/users", ({ body }: { body: { email: string; name: string; metadata?: Record<string, unknown> } }): ApiResponse<User> => {
    const newUser: User = {
      id: `user-${Date.now()}` as UserId,
      email: body.email,
      name: body.name,
      createdAt: new Date(),
      metadata: body.metadata || {},
    };
    
    users.set(newUser.id, newUser);
    
    return createSuccessResponse(newUser);
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      name: t.String({ minLength: 1 }),
      metadata: t.Optional(t.Record(t.String(), t.Unknown())),
    })
  })

  // GET /api/posts - List all posts
  // Uses PaginatedResponse<Post> from shared package
  .get("/api/posts", ({ query }): PaginatedResponse<Post> => {
    const page = parseInt(query.page || "1");
    const pageSize = Math.min(
      parseInt(query.pageSize || String(DEFAULT_PAGE_SIZE)),
      100
    );
    
    const allPosts = Array.from(posts.values());
    const start = (page - 1) * pageSize;
    const items = allPosts.slice(start, start + pageSize);
    
    return {
      items,
      total: allPosts.length,
      page,
      pageSize,
      hasMore: start + pageSize < allPosts.length,
    };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    })
  })

  // GET /api/posts/:id - Get post by ID
  .get("/api/posts/:id", ({ params }): ApiResponse<Post | null> => {
    const postId = params.id as PostId;
    const post = posts.get(postId);
    
    if (!post) {
      return createErrorResponse("Post not found");
    }
    
    return createSuccessResponse(post);
  }, {
    params: t.Object({
      id: t.String(),
    })
  })

  // POST /api/posts - Create a new post
  .post("/api/posts", ({ body }): ApiResponse<Post> => {
    const authorId = body.authorId as UserId;
    
    if (!users.has(authorId)) {
      return createErrorResponse("Author not found");
    }
    
    const newPost: Post = {
      id: `post-${Date.now()}` as PostId,
      authorId,
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      publishedAt: body.publish ? new Date() : null,
    };
    
    posts.set(newPost.id, newPost);
    
    return createSuccessResponse(newPost);
  }, {
    body: t.Object({
      authorId: t.String(),
      title: t.String({ minLength: 1 }),
      content: t.String(),
      tags: t.Optional(t.Array(t.String())),
      publish: t.Optional(t.Boolean()),
    })
  });

export default app;
