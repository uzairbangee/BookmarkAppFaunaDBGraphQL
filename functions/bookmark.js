const { ApolloServer, gql } = require('apollo-server-lambda')
const faunadb = require('faunadb'),
  q = faunadb.query;

const dotenv = require('dotenv');
dotenv.config();

const typeDefs = gql`
  type Query {
    bookmarks: [Bookmark!]
  }
  type Bookmark {
    id: ID!
    url: String!
    description: String!
  }

  type Mutation {
    addBookmark(url: String!, description: String!): Bookmark
    removeBookmark(id: ID!): Bookmark
  }
`

const resolvers = {
  Query: {
    bookmarks: async (parent, args, context) => {
      try {
        console.log('in func')
        var client = new faunadb.Client({ secret: process.env.FAUNADB_ADMIN_SECRET });
        let result = await client.query(
          q.Map(
            q.Paginate(q.Documents(q.Collection('bookmarks'))),
            q.Lambda("bookmark",
              q.Let(
                {
                  bookmarkDoc: q.Get(q.Var("bookmark"))
                },
                {
                  id: q.Select(["ref", "id"], q.Var("bookmarkDoc")),
                  url: q.Select(["data", "url"], q.Var("bookmarkDoc")),
                  description: q.Select(["data", "description"], q.Var("bookmarkDoc"))
                }
              )
            )
          )
        );
        
        return result.data;
      }
      catch(err) {
        console.log(err);
      }
    },
  },
  Mutation : {
    addBookmark : async (_, {url, description}) => {
      try{
        var client = new faunadb.Client({ secret: process.env.FAUNADB_ADMIN_SECRET });

        let result = await client.query(
          q.Create(
            q.Collection("bookmarks"),
            {
              data : {
                url: url,
                description: description
              }
            }
          )
        )

        return {
          id : result.ref.id,
          url: result.data.url,
          description: result.data.description
        }
      }
      catch(err){
        console.log(err)
      }
    },
    removeBookmark: async (_, {id}) => {
      try {
        console.log(id)
        var client = new faunadb.Client({ secret: process.env.FAUNADB_ADMIN_SECRET });
        const result = await client.query(
            q.Delete(
                q.Ref(q.Collection("bookmarks"), ""+id)
            )
        )
        
        return {
            id : result.ref.id,
            url: result.data.url,
            description: result.data.description
        }
      }
      catch(err){
          return err.toString()
      }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

exports.handler = server.createHandler()
